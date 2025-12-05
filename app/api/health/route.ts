/**
 * Health Check API Endpoint
 * Provides system health status for monitoring and load balancers
 *
 * GET /api/health - Quick health check
 * GET /api/health?detailed=true - Detailed health check with component status
 */

import { NextRequest, NextResponse } from 'next/server';
import featureFlags from '@/lib/featureFlags';

/**
 * Health status type alias
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Component health status
 */
interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

/**
 * Health check response
 */
interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  components?: ComponentHealth[];
  details?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    featureFlags: {
      enabled: number;
      total: number;
    };
  };
}

/**
 * Get application version from package.json or environment
 */
function getVersion(): string {
  return process.env.npm_package_version || process.env.APP_VERSION || '0.1.0';
}

/**
 * Get uptime in seconds
 */
function getUptime(): number {
  return Math.floor(process.uptime());
}

/**
 * Check feature flags health
 */
function checkFeatureFlags(): ComponentHealth {
  try {
    const flags = featureFlags;
    const total = Object.keys(flags).length;
    const enabled = Object.values(flags).filter(flag => {
      if (typeof flag === 'boolean') return flag;
      if (typeof flag === 'object' && flag !== null) return flag.enabled;
      return false;
    }).length;

    return {
      name: 'feature-flags',
      status: 'healthy',
      message: `${enabled}/${total} flags enabled`,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return {
      name: 'feature-flags',
      status: 'unhealthy',
      message: 'Failed to load feature flags',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check memory health
 */
function checkMemory(): ComponentHealth {
  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (percentage > 90) {
      status = 'unhealthy';
    } else if (percentage > 75) {
      status = 'degraded';
    }

    return {
      name: 'memory',
      status,
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage}%)`,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return {
      name: 'memory',
      status: 'unhealthy',
      message: 'Failed to check memory',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): ComponentHealth {
  const requiredVars = ['JWT_SECRET', 'NEXT_PUBLIC_API_URL'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    return {
      name: 'environment',
      status: 'degraded',
      message: `Missing: ${missingVars.join(', ')}`,
      lastChecked: new Date().toISOString(),
    };
  }

  return {
    name: 'environment',
    status: 'healthy',
    message: 'All required variables present',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Calculate overall status from component health
 */
function calculateOverallStatus(
  components: ComponentHealth[]
): 'healthy' | 'degraded' | 'unhealthy' {
  const hasUnhealthy = components.some(c => c.status === 'unhealthy');
  const hasDegraded = components.some(c => c.status === 'degraded');

  if (hasUnhealthy) return 'unhealthy';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

/**
 * GET /api/health
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthResponse>> {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  // Quick health check response
  if (!detailed) {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: getVersion(),
        uptime: getUptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // Detailed health check
  const components: ComponentHealth[] = [checkFeatureFlags(), checkMemory(), checkEnvironment()];

  const memoryUsage = process.memoryUsage();
  const featureFlagsObj = featureFlags;
  const totalFlags = Object.keys(featureFlagsObj).length;
  const enabledFlags = Object.values(featureFlagsObj).filter(flag => {
    if (typeof flag === 'boolean') return flag;
    if (typeof flag === 'object' && flag !== null) return flag.enabled;
    return false;
  }).length;

  const overallStatus = calculateOverallStatus(components);
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: getUptime(),
      environment: process.env.NODE_ENV || 'development',
      components,
      details: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        featureFlags: {
          enabled: enabledFlags,
          total: totalFlags,
        },
      },
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
