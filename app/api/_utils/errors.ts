import { NextResponse } from 'next/server';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  message: string;
  details?: unknown;
  code?: string;
}

/**
 * Creates a standardized error response
 * @param message Error message
 * @param status HTTP status code
 * @param details Additional error details (optional)
 * @param code Error code (optional)
 * @returns NextResponse with error details
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
  code?: string
): NextResponse {
  const errorBody: ErrorResponse = {
    message,
  };

  if (details) errorBody.details = details;
  if (code) errorBody.code = code;

  return NextResponse.json(errorBody, { status });
}

/**
 * Common error responses
 */
export const Errors = {
  badRequest: (message: string = 'Bad request', details?: unknown) =>
    createErrorResponse(message, 400, details, 'BAD_REQUEST'),

  unauthorized: (message: string = 'Unauthorized', details?: unknown) =>
    createErrorResponse(message, 401, details, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden', details?: unknown) =>
    createErrorResponse(message, 403, details, 'FORBIDDEN'),

  notFound: (message: string = 'Not found', details?: unknown) =>
    createErrorResponse(message, 404, details, 'NOT_FOUND'),

  methodNotAllowed: (message: string = 'Method not allowed', details?: unknown) =>
    createErrorResponse(message, 405, details, 'METHOD_NOT_ALLOWED'),

  conflict: (message: string = 'Conflict', details?: unknown) =>
    createErrorResponse(message, 409, details, 'CONFLICT'),

  internalServerError: (message: string = 'Internal server error', details?: unknown) =>
    createErrorResponse(message, 500, details, 'INTERNAL_SERVER_ERROR'),
};

/**
 * Wraps a route handler with try/catch for standardized error handling
 * @param handler The route handler function
 * @returns A function that handles errors consistently
 */
export function withErrorHandling<TContext = unknown>(
  handler: (req: Request, context?: TContext) => Promise<Response>
): (req: Request, context?: TContext) => Promise<Response> {
  return async (req: Request, context?: TContext) => {
    try {
      return await handler(req, context);
    } catch (error: unknown) {
      console.error('API Error:', {
        error,
        timestamp: new Date().toISOString(),
        url: req?.url || 'unknown',
        method: req?.method || 'unknown',
      });

      // Handle specific known errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        const validationError = error as { name: string; details?: unknown };
        return Errors.badRequest('Validation error', validationError.details);
      }

      // Default to internal server error
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String((error as { message: unknown }).message)
        : 'An unexpected error occurred';
      const errorCause = error && typeof error === 'object' && 'cause' in error
        ? (error as { cause: unknown }).cause
        : undefined;
        
      return Errors.internalServerError(errorMessage, errorCause);
    }
  };
}
