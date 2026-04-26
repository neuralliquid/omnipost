/**
 * Org Health API Route
 * GET - Organizational health metrics from mcp-org via phoenix-flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkAuthAndRateLimit, withErrorHandling } from '@/app/api/_utils/middleware';
import { getOrgHealth, PhoenixFlowUnavailableError } from '@/lib/integrations/phoenix-flow';

/**
 * GET /api/org/health
 * Returns org health metrics (proxied from mcp-org via phoenix-flow)
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/org/health',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  try {
    const health = await getOrgHealth();
    return NextResponse.json({ health });
  } catch (error: unknown) {
    if (error instanceof PhoenixFlowUnavailableError) {
      return NextResponse.json(
        { error: 'Organizational health service is unavailable' },
        { status: 503 }
      );
    }
    throw error;
  }
});
