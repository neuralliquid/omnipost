import { NextResponse } from 'next/server';
import { platforms, getPlatformConfig } from '../../../../../lib/config/platforms';
import { Errors } from '../../../_utils/errors';
import { isAuthenticated } from '../../../_utils/auth';
import { createLogEntry, logToAuditTrail } from '../../../_utils/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required to access platform capabilities');
    }

    // Await params and get the id
    const { id } = await params;

    if (!id) {
      return Errors.badRequest('Platform ID is required');
    }

    const platformId = parseInt(id);
    if (isNaN(platformId)) {
      return Errors.badRequest('Invalid platform ID');
    }

    // Find platform
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) {
      return Errors.notFound('Platform not found');
    }

    // Log the access to platform capabilities
    const logEntry = await createLogEntry('GET_PLATFORM_CAPABILITIES', {
      platformId,
      platformName: platform.name,
    });
    await logToAuditTrail(logEntry);

    const config = getPlatformConfig(platform.name);

    if (!config) {
      return Errors.notFound('Platform configuration not found');
    }

    return NextResponse.json({
      platform,
      capabilities: config.capabilities || [],
    });
  } catch (error) {
    console.error('API Error:', {
      error,
      timestamp: new Date().toISOString(),
      url: request?.url || 'unknown',
      method: request?.method || 'unknown',
    });

    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'An unexpected error occurred';

    return Errors.internalServerError(errorMessage);
  }
}
