/**
 * Rate Limiting Utility
 *
 * Implements rate limiting for API endpoints to prevent:
 * - Brute force attacks on authentication
 * - DDoS attacks
 * - Cost exploitation (AI API abuse)
 *
 * Uses in-memory storage for simplicity. For production with multiple
 * instances, consider Redis or Upstash Rate Limit.
 */

import { NextRequest, NextResponse } from 'next/server';

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

// In-memory store for rate limiting
// NOTE: For production multi-instance deployments, replace with Redis or Upstash Rate Limit
// Example: import { Ratelimit } from "@upstash/ratelimit";
// const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "10 s") });
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically (every 60 seconds)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

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
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request, endpoint);
  const now = Date.now();

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

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit<
  T extends (request: NextRequest, ...args: unknown[]) => Promise<Response>,
>(handler: T, endpoint: string, config: RateLimitConfig): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    const result = checkRateLimit(request, endpoint, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, ...args);

    // Clone response to add headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return newResponse;
  }) as T;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
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
};
