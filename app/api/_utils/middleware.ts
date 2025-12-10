/**
 * API Route Middleware Helpers
 * Reduces code duplication by providing reusable middleware patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from './auth';
import { checkRateLimitOrRespond } from './responses';
import { ErrorResponses } from './responses';
import { RateLimitPresets } from './rateLimit';
import { validateEmail as validateEmailUtil } from './validation';

type RateLimitPreset = typeof RateLimitPresets[keyof typeof RateLimitPresets];

/**
 * Require authentication middleware
 * Returns error response if not authenticated, null otherwise
 */
export async function requireAuth(): Promise<NextResponse | null> {
  if (!(await isAuthenticated())) {
    return ErrorResponses.unauthorized();
  }
  return null;
}

/**
 * Require authentication and return current user ID
 * Returns error response or user ID
 */
export async function requireAuthWithUserId(): Promise<
  { error: NextResponse } | { userId: string }
> {
  if (!(await isAuthenticated())) {
    return { error: ErrorResponses.unauthorized() };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: ErrorResponses.unauthorized() };
  }

  return { userId };
}

/**
 * Apply rate limiting and authentication check
 * Returns error response if check fails, null otherwise
 */
export async function checkAuthAndRateLimit(
  request: NextRequest,
  endpoint: string,
  preset: RateLimitPreset
): Promise<NextResponse | null> {
  // Check rate limit first
  const rateLimitResponse = checkRateLimitOrRespond(request, endpoint, preset);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Then check authentication
  return await requireAuth();
}

/**
 * Validate required body fields
 * Returns error response if validation fails, null otherwise
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse | null {
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      return ErrorResponses.badRequest(`${field} is required`);
    }
  }
  return null;
}

/**
 * Validate enum field value
 * Returns error response if validation fails, null otherwise
 */
export function validateEnumField<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): NextResponse | null {
  if (!allowedValues.includes(value as T)) {
    return ErrorResponses.badRequest(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return null;
}

/**
 * Validate array field
 * Returns error response if validation fails, null otherwise
 */
export function validateArrayField(
  value: unknown,
  fieldName: string,
  minLength?: number
): NextResponse | null {
  if (!Array.isArray(value)) {
    return ErrorResponses.badRequest(`${fieldName} must be an array`);
  }

  if (minLength !== undefined && value.length < minLength) {
    return ErrorResponses.badRequest(
      `${fieldName} must have at least ${minLength} item(s)`
    );
  }

  return null;
}

/**
 * Try-catch wrapper for API route handlers
 * Automatically handles errors and logs them
 */
export function withErrorHandling<T>(
  handler: (request: Request, context: T) => Promise<NextResponse>
): (request: Request, context: T) => Promise<NextResponse>;
export function withErrorHandling(
  handler: (request: Request) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse>;
export function withErrorHandling<T = any>(
  handler: ((request: Request, context: T) => Promise<NextResponse>) | ((request: Request) => Promise<NextResponse>)
) {
  return async (request: Request, context?: T): Promise<NextResponse> => {
    try {
      if (context !== undefined) {
        return await (handler as (request: Request, context: T) => Promise<NextResponse>)(request, context);
      }
      return await (handler as (request: Request) => Promise<NextResponse>)(request);
    } catch (error) {
      console.error('API Error:', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Combined middleware: error handling + auth + rate limiting
 * Use this as a wrapper for your route handlers
 */
export function withAuthAndRateLimit<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>,
  endpoint: string,
  preset: RateLimitPreset
) {
  return withErrorHandling(async (request: Request, context?: T) => {
    const nextRequest = request as NextRequest;

    // Check rate limit and auth
    const checkResponse = await checkAuthAndRateLimit(nextRequest, endpoint, preset);
    if (checkResponse) {
      return checkResponse;
    }

    // Execute handler
    return await handler(nextRequest, context);
  });
}

/**
 * Email validation helper using the existing validation utility
 * Returns error response if validation fails, null otherwise
 */
export function validateEmailFormat(
  email: string,
  fieldName: string = 'email'
): NextResponse | null {
  // Use existing ReDoS-safe email validation from validation.ts
  const error = validateEmailUtil(fieldName, email);
  if (error) {
    return ErrorResponses.badRequest(error);
  }
  return null;
}

/**
 * Parse comma-separated enum values from query parameter
 * Returns the parsed value(s) or undefined if invalid
 */
export function parseEnumFilter<T extends string>(
  value: string | null,
  validValues: readonly T[]
): T | T[] | undefined {
  if (!value) return undefined;

  const items = value.split(',') as T[];
  
  // Check if all items are valid
  const allValid = items.every((item) =>
    (validValues as readonly string[]).includes(item)
  );
  
  if (!allValid) return undefined;

  return items.length === 1 ? items[0] : items;
}
