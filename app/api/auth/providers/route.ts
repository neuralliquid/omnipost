/**
 * GET /api/auth/providers
 *
 * Public endpoint that returns available authentication providers.
 * Calls the external identity API via the identity-provider abstraction
 * without HTTP caching so runtime identity configuration changes are reflected
 * immediately on login/signup pages.
 *
 * Rate-limited to prevent abuse (public endpoint).
 */

import { NextResponse } from 'next/server';
import { withErrorHandling } from '../../_utils/errors';
import { withRateLimit, RateLimitPresets } from '../../_utils/rateLimit';
import { getAvailableProviders } from '../../../../lib/auth/identity-provider';

async function handleGetProviders(): Promise<NextResponse> {
  const providers = await getAvailableProviders();

  // Only return the fields the client needs
  const publicProviders = providers
    .filter(p => p.enabled)
    .map(({ id, name, type, icon }) => ({ id, name, type, icon }));

  return NextResponse.json(
    { providers: publicProviders },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export const GET = withRateLimit(
  withErrorHandling(handleGetProviders),
  '/api/auth/providers',
  RateLimitPresets.PUBLIC_API
);
