import { headers } from 'next/headers';

/**
 * Log entry structure for API audit trail
 */
export interface LogEntry {
  action: string;
  user: string;
  timestamp: string;
  path: string;
  method: string;
  body?: Record<string, unknown>;
  result?: string;
  statusCode?: number;
}

/**
 * Sanitizes sensitive data from request body
 * @param body The request body to sanitize
 * @returns Sanitized body object
 */
export function sanitizeRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body) return body;

  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  const sanitized = { ...body };

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();

    // Check for sensitive fields first
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Process nested objects (plain objects only, not arrays)
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      value.constructor === Object
    ) {
      sanitized[key] = sanitizeRequestBody(value as Record<string, unknown>);
    }
  }

  return sanitized;
}

/**
 * Creates an audit log entry
 * @param action The action being performed
 * @param body The request body (will be sanitized)
 * @param result The result of the action
 * @param statusCode The HTTP status code
 * @returns Log entry object
 */
export async function createLogEntry(
  action: string,
  body?: Record<string, unknown>,
  result?: string,
  statusCode?: number
): Promise<LogEntry> {
  const headersList = await headers();
  const path = headersList.get('x-invoke-path') || 'unknown';
  const method = headersList.get('x-http-method') || 'unknown';
  const user = headersList.get('x-user-id') || 'anonymous';

  return {
    action,
    user,
    timestamp: new Date().toISOString(),
    path,
    method,
    body: body ? sanitizeRequestBody(body) : undefined,
    result,
    statusCode,
  };
}

/**
 * Type guard to check if prisma client has auditLog.create capability
 */
function hasPrismaAuditLog(
  client: unknown
): client is { auditLog: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> } } {
  if (typeof client !== 'object' || client === null) {
    return false;
  }
  if (!('auditLog' in client)) {
    return false;
  }
  const auditLog = (client as Record<string, unknown>).auditLog;
  if (typeof auditLog !== 'object' || auditLog === null) {
    return false;
  }
  if (!('create' in auditLog)) {
    return false;
  }
  return typeof (auditLog as Record<string, unknown>).create === 'function';
}

/**
 * Logs an API action to the audit trail
 * Uses Prisma database when available, falls back to console logging
 * @param entry The log entry to record
 */
export async function logToAuditTrail(entry: LogEntry): Promise<void> {
  // Try to log to database if Prisma is available
  try {
    const { prisma } = await import('../../../lib/db/prisma');
    const prismaClient: unknown = prisma;
    if (hasPrismaAuditLog(prismaClient)) {
      await prismaClient.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.user === 'anonymous' ? null : entry.user,
          path: entry.path,
          method: entry.method,
          body: entry.body ? JSON.stringify(entry.body) : null,
          result: entry.result,
          statusCode: entry.statusCode,
        },
      });
      return; // Successfully logged to database
    }
  } catch {
    // Prisma not available or error, fall through to console logging
  }

  // Fallback to console logging
  console.log('[AUDIT]', JSON.stringify(entry));
}

interface ResultWithStatus {
  status?: number;
}

/**
 * Middleware-style function to add audit logging to a route handler
 * @param action The action name to log
 * @param handler The route handler function
 * @returns A function that logs the action before calling the handler
 */
export function withAuditLogging<T>(
  action: string,
  handler: (body?: Record<string, unknown>) => Promise<T>
): (body?: Record<string, unknown>) => Promise<T> {
  return async (body?: Record<string, unknown>) => {
    // Log the start of the action
    const entry = await createLogEntry(action, body);
    await logToAuditTrail(entry);

    // Execute the handler
    const result = await handler(body);

    // Log the completion of the action
    const completionEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      result: result ? 'success' : 'failure',
      statusCode: isResultWithStatus(result) ? result.status : 200,
    };
    await logToAuditTrail(completionEntry);

    return result;
  };
}

/**
 * Type guard to check if a result has a status property
 */
function isResultWithStatus(result: unknown): result is ResultWithStatus {
  return typeof result === 'object' && result !== null && 'status' in result;
}
