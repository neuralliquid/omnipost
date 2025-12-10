/**
 * Shared API Response Utilities
 * Reduces code duplication across API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets } from './rateLimit';

type RateLimitPreset = (typeof RateLimitPresets)[keyof typeof RateLimitPresets];

/**
 * Create a rate limit exceeded response with proper headers
 */
export function rateLimitExceededResponse(
  resetTime: number,
  preset: RateLimitPreset
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { error: preset.message || 'Too many requests', retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': preset.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}

/**
 * Check rate limit and return response if exceeded
 * Returns null if the request is allowed
 */
export function checkRateLimitOrRespond(
  request: NextRequest,
  endpoint: string,
  preset: RateLimitPreset
): NextResponse | null {
  const result = checkRateLimit(request, endpoint, preset);
  if (!result.allowed) {
    return rateLimitExceededResponse(result.resetTime, preset);
  }
  return null;
}

/**
 * Standard error responses
 */
export const ErrorResponses = {
  unauthorized: () => NextResponse.json({ error: 'Authentication required' }, { status: 401 }),

  forbidden: (message: string = 'Access denied') =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (resource: string = 'Resource') =>
    NextResponse.json({ error: `${resource} not found` }, { status: 404 }),

  badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),

  validationError: (errors: string[]) =>
    NextResponse.json({ error: 'Validation failed', errors }, { status: 400 }),

  internalError: (logMessage?: string, error?: unknown) => {
    if (logMessage) {
      console.error(logMessage, error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  },

  conflict: (message: string) => NextResponse.json({ error: message }, { status: 409 }),
};

/**
 * Standard success responses
 */
export const SuccessResponses = {
  ok: <T>(data: T) => NextResponse.json(data),

  created: <T>(data: T) => NextResponse.json(data, { status: 201 }),

  noContent: () => new NextResponse(null, { status: 204 }),

  deleted: (message: string = 'Successfully deleted') =>
    NextResponse.json({ success: true, message }),
};
