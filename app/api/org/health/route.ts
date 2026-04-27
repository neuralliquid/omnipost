/**
 * Org Health API Route
 * GET - Organizational health metrics from mcp-org via baton
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkAuthAndRateLimit, withErrorHandling } from '@/app/api/_utils/middleware';
import { getOrgHealth, BatonUnavailableError } from '@/lib/integrations/baton';

/**
 * GET /api/org/health
 * Returns org health metrics (proxied from mcp-org via baton)
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
    if (error instanceof BatonUnavailableError) {
      return NextResponse.json(
        { error: 'Organizational health service is unavailable' },
        { status: 503 }
      );
    }
    throw error;
  }
});
