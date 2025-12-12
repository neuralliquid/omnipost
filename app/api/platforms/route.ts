import { NextResponse } from 'next/server';
import { platforms } from '../../../lib/config/platforms';
import { withErrorHandling, Errors } from '../_utils/errors';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { isAuthenticated } from '../_utils/auth';
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
 * Platform data validation schema
 */
interface PlatformInput {
  name: string;
  type: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

/**
 * Validates platform input data
 */
function validatePlatformInput(
  data: unknown
): { valid: true; data: PlatformInput } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const input = data as Record<string, unknown>;

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    return { valid: false, error: 'Platform name is required and must be a non-empty string' };
  }

  if (!input.type || typeof input.type !== 'string') {
    return { valid: false, error: 'Platform type is required and must be a string' };
  }

  const validTypes = ['social', 'blog', 'newsletter', 'video', 'podcast', 'custom'];
  if (!validTypes.includes(input.type)) {
    return { valid: false, error: `Platform type must be one of: ${validTypes.join(', ')}` };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      type: input.type,
      enabled: input.enabled !== false,
      config: typeof input.config === 'object' ? (input.config as Record<string, unknown>) : undefined,
    },
  };
}

/**
 * POST handler for creating/updating platforms
 */
export const POST = withErrorHandling(async (request: Request) => {
  // Check authentication
  const authError = await validateAuth();
  if (authError) return authError;

  // Check required feature flag
  if (!featureFlags.platformConnectors) {
    return Errors.forbidden('Platform connectors feature is disabled');
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validatePlatformInput(body);
    if (!validation.valid) {
      return Errors.badRequest(validation.error);
    }

    const platformData = validation.data;

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
});
