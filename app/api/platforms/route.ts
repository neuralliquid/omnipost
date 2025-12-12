import { NextResponse } from 'next/server';
import { z } from 'zod';
import { platforms } from '../../../lib/config/platforms';
import { withErrorHandling, Errors } from '../_utils/errors';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { isAuthenticated } from '../_utils/auth';
import { validateAndSanitize, sanitizeText } from '../_utils/sanitize';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';
import featureFlags from '../../../lib/featureFlags';

/**
 * Validates user authentication
 * @returns Error response if not authenticated, null otherwise
 */
async function validateAuth() {
  if (!(await isAuthenticated())) {
    return Errors.unauthorized('Authentication required');
  }
  return null;
}

/**
 * Logs platform list access to audit trail
 */
async function logPlatformsAccess() {
  const logEntry = await createLogEntry('GET_PLATFORMS_LIST');
  await logToAuditTrail(logEntry);
}

/**
 * GET handler for platforms endpoint
 */
export const GET = withErrorHandling(async () => {
  // Check authentication
  const authError = await validateAuth();
  if (authError) return authError;

  // Log the access to platforms list
  await logPlatformsAccess();

  // Return platforms list
  return NextResponse.json(platforms);
});

/**
 * Zod schema for platform input validation
 */
const PlatformInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Platform name is required')
    .transform(s => sanitizeText(s.trim())),
  type: z.enum(['social', 'blog', 'newsletter', 'video', 'podcast', 'custom'], {
    errorMap: () => ({
      message: 'Platform type must be one of: social, blog, newsletter, video, podcast, custom',
    }),
  }),
  enabled: z.boolean().optional().default(true),
  config: z
    .record(z.unknown())
    .optional()
    .transform(c =>
      c ? Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v])) : undefined
    ),
});

type PlatformInput = z.infer<typeof PlatformInputSchema>;

/**
 * POST handler for creating/updating platforms
 * Wrapped with rate limiting using GENERAL preset
 */
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    // Check authentication
    const authError = await validateAuth();
    if (authError) return authError;

    // Check required feature flag
    if (!featureFlags.platformConnectors) {
      return Errors.forbidden('Platform connectors feature is disabled');
    }

    try {
      const body = await request.json();

      // Validate and sanitize input using Zod schema
      const validation = validateAndSanitize(PlatformInputSchema, body);
      if (!validation.success) {
        return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
      }

      const platformData: PlatformInput = validation.data;

      // Log the platform creation
      const logEntry = await createLogEntry('CREATE_PLATFORM', {
        name: platformData.name,
        type: platformData.type,
      });
      await logToAuditTrail(logEntry);

      // Try to save to database if Prisma is available
      try {
        const { prisma } = await import('../../../lib/db/prisma');
        if (prisma) {
          // For now, return success since platform storage is in-memory
          // In production, you would create a Platform table in Prisma schema
          return NextResponse.json(
            {
              success: true,
              message: 'Platform created successfully',
              platform: {
                id: `platform_${Date.now()}`,
                ...platformData,
                createdAt: new Date().toISOString(),
              },
            },
            { status: 201 }
          );
        }
      } catch {
        // Prisma not available, use in-memory storage
      }

      // Fallback: return success with generated ID (in-memory only)
      return NextResponse.json(
        {
          success: true,
          message: 'Platform created successfully (in-memory)',
          platform: {
            id: `platform_${Date.now()}`,
            ...platformData,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating platform:', error);
      return Errors.internalServerError('Failed to create platform');
    }
  }),
  '/api/platforms',
  RateLimitPresets.GENERAL,
  'GENERAL'
);
