/**
 * Rate Limiting Utility
 *
 * Implements rate limiting for API endpoints to prevent:
 * - Brute force attacks on authentication
 * - DDoS attacks
 * - Cost exploitation (AI API abuse)
 *
 * Supports two backends:
 * 1. Upstash Redis (recommended for production) - when UPSTASH_REDIS_REST_URL is set
 * 2. In-memory (development/single instance) - fallback when Redis not configured
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import types for Upstash (avoids ESM issues in Jest)
type UpstashRatelimit = InstanceType<typeof import('@upstash/ratelimit').Ratelimit>;

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom error message
   */
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Safely convert error to string for logging (prevents sensitive data leaks)
 */
function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    // Only include stack in debug mode
    if (process.env.DEBUG === 'true' && error.stack) {
      return `${message}\n${error.stack}`;
    }
    return message;
  }
  return String(error);
}

// Check if Upstash Redis is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Lazy-loaded Upstash rate limiters (avoids ESM import issues in Jest)
let upstashLimiters: Map<string, UpstashRatelimit> | null = null;
let upstashInitialized = false;

/**
 * Initialize Upstash rate limiters lazily
 */
async function initUpstash(): Promise<Map<string, UpstashRatelimit> | null> {
  if (upstashInitialized) return upstashLimiters;
  upstashInitialized = true;

  if (!isUpstashConfigured) {
    // Log warning in production if using in-memory rate limiting
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Rate Limit] Using in-memory rate limiting. For production deployments with multiple instances, configure UPSTASH_REDIS_REST_URL for distributed rate limiting.'
      );
    }
    return null;
  }

  try {
    // Dynamic import to avoid Jest ESM issues
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = Redis.fromEnv();
    upstashLimiters = new Map();

    // Pre-create rate limiters for each preset
    // AUTH: 5 requests per 15 minutes
    upstashLimiters.set(
      'AUTH',
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      })
    );

    // AI_SERVICE: 10 requests per minute
    upstashLimiters.set(
      'AI_SERVICE',
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:ai',
      })
    );

    // GENERAL: 100 requests per 15 minutes
    upstashLimiters.set(
      'GENERAL',
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '15 m'),
        analytics: true,
        prefix: 'ratelimit:general',
      })
    );

    // ADMIN: 50 requests per hour
    upstashLimiters.set(
      'ADMIN',
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, '1 h'),
        analytics: true,
        prefix: 'ratelimit:admin',
      })
    );

    // PUBLIC_API: 20 requests per minute
    upstashLimiters.set(
      'PUBLIC_API',
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: 'ratelimit:public',
      })
    );

    console.log('[Rate Limit] Using Upstash Redis for distributed rate limiting');
    return upstashLimiters;
  } catch (error) {
    // Use safe error message to prevent sensitive data leaks
    console.warn(
      '[Rate Limit] Failed to initialize Upstash, falling back to in-memory:',
      safeErrorMessage(error)
    );
    return null;
  }
}

/**
 * In-memory store for rate limiting (fallback when Redis not available)
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Last cleanup timestamp for opportunistic cleanup (avoids setInterval in serverless)
 */
let lastCleanup = 0;

/**
 * Get a unique key for rate limiting based on IP and endpoint
 */
function getRateLimitKey(request: NextRequest, endpoint: string): string {
  // Try to get real IP from various headers (proxy-aware)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `${endpoint}:${ip}`;
}

/**
 * Get client IP for Upstash
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

/**
 * Check if request should be rate limited (in-memory version)
 * Includes opportunistic cleanup of expired entries (no setInterval needed)
 */
function checkRateLimitInMemory(
  request: NextRequest,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request, endpoint);
  const now = Date.now();

  // Opportunistic cleanup: every 60 seconds, clean expired entries
  // This avoids using setInterval which keeps serverless/edge functions alive
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(entryKey);
      }
    }
  }

  const entry = rateLimitStore.get(key);

  // No entry or expired entry - allow and create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and not expired
  if (entry.count < config.maxRequests) {
    // Under limit - increment and allow
    entry.count++;
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Over limit - deny
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

// Default window for restrictive fallback (15 minutes)
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Predefined rate limit configurations
 * Moved before checkRateLimitUpstash to be available for preset lookup
 */
export const RateLimitPresets: Record<string, RateLimitConfig> = {
  /**
   * For authentication endpoints - prevent brute force
   * 5 requests per 15 minutes
   */
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  /**
   * For AI service endpoints - prevent cost exploitation
   * 10 requests per minute
   */
  AI_SERVICE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many AI requests. Please try again in a minute.',
  },

  /**
   * For general API endpoints
   * 100 requests per 15 minutes
   */
  GENERAL: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please try again later.',
  },

  /**
   * For admin endpoints
   * 50 requests per hour
   */
  ADMIN: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many admin requests. Please try again in an hour.',
  },

  /**
   * For public API endpoints (form submissions, etc.) - stricter limits
   * 20 requests per minute to prevent flooding
   */
  PUBLIC_API: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again in a minute.',
  },
};

/**
 * Check if request should be rate limited (Upstash version)
 */
async function checkRateLimitUpstash(
  request: NextRequest,
  presetName: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Lazy-initialize Upstash
  const limiters = await initUpstash();
  const limiter = limiters?.get(presetName);
  const ip = getClientIp(request);

  if (!limiter) {
    // Log error for missing limiter configuration (possible typo in presetName)
    console.error(
      `[Rate Limit] No limiter found for preset "${presetName}" (IP: ${ip}). ` +
        'This may indicate a configuration error. Denying request as a safety measure.'
    );
    // Return restrictive default to preserve rate limiting protection
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + DEFAULT_WINDOW_MS,
    };
  }

  const { success, remaining, reset } = await limiter.limit(ip);

  return {
    allowed: success,
    remaining,
    resetTime: reset,
  };
}

/**
 * Check if request should be rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  config: RateLimitConfig,
  presetName?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Use Upstash if configured and preset name provided
  if (isUpstashConfigured && presetName) {
    return checkRateLimitUpstash(request, presetName);
  }

  // Fall back to in-memory
  return checkRateLimitInMemory(request, endpoint, config);
}

/**
 * Synchronous check for backward compatibility (in-memory only)
 */
export function checkRateLimitSync(
  request: NextRequest,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  return checkRateLimitInMemory(request, endpoint, config);
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit<
  T extends (request: NextRequest, ...args: unknown[]) => Promise<Response>,
>(handler: T, endpoint: string, config: RateLimitConfig, presetName?: string): T {
  // Resolve the effective config: use preset if provided, otherwise use passed config
  // This ensures headers and messages are consistent with the preset being enforced
  const effectiveConfig =
    presetName && RateLimitPresets[presetName] ? RateLimitPresets[presetName] : config;

  return (async (request: NextRequest, ...args: unknown[]) => {
    const result = await checkRateLimit(request, endpoint, effectiveConfig, presetName);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      // Convert resetTime to seconds for HTTP standard compliance
      const resetTimeSeconds = Math.ceil(result.resetTime / 1000);

      return NextResponse.json(
        {
          error: effectiveConfig.message || 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': effectiveConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTimeSeconds.toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, ...args);

    // Convert resetTime to seconds for HTTP standard compliance
    const resetTimeSeconds = Math.ceil(result.resetTime / 1000);

    // Clone response to add headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', effectiveConfig.maxRequests.toString());
    newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', resetTimeSeconds.toString());

    return newResponse;
  }) as T;
}

/**
 * Check if Upstash is being used
 */
export function isUsingUpstash(): boolean {
  return isUpstashConfigured;
}
