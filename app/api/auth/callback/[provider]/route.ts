/**
 * GET /api/auth/callback/[provider]
 *
 * Handles OAuth callbacks from external identity providers.
 *
 * Flow:
 * 1. Receives ?code= query parameter from the OAuth redirect
 * 2. Exchanges the code with the external identity API
 * 3. Creates or finds a local user
 * 4. Generates a JWT and sets an auth cookie
 * 5. Redirects to /onboarding (new user) or /dashboard (existing user)
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../../../_utils/audit';
import { Errors, withErrorHandling } from '../../../_utils/errors';
import { withRateLimit, RateLimitPresets } from '../../../_utils/rateLimit';
import { authService } from '../../../../../lib/auth/auth-service';
import { handleAuthCallback } from '../../../../../lib/auth/identity-provider';

/**
 * In-memory store for users created via external providers.
 * In production this should be backed by a database.
 */
const externalUsers = new Map<
  string,
  { id: string; username: string; email: string; role: string; provider: string; externalId: string }
>();

/**
 * Find an existing user by external provider + external ID, or by email.
 */
function findExistingUser(
  provider: string,
  externalId: string,
  email: string
): { id: string; username: string; role: string; isNew: false } | null {
  // Check external users store
  for (const user of externalUsers.values()) {
    if (user.provider === provider && user.externalId === externalId) {
      return { id: user.id, username: user.username, role: user.role, isNew: false };
    }
    if (user.email === email) {
      return { id: user.id, username: user.username, role: user.role, isNew: false };
    }
  }

  return null;
}

async function handleCallback(
  request: Request,
  context?: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  if (!context) {
    return Errors.badRequest('Missing route context');
  }
  const { provider } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return Errors.badRequest('Missing authorization code');
  }

  if (!provider || provider.length > 50) {
    return Errors.badRequest('Invalid provider');
  }

  // Exchange the code with the external identity API
  const authResult = await handleAuthCallback(provider, code);

  if (!authResult.success || !authResult.user) {
    await logToAuditTrail(
      await createLogEntry('EXTERNAL_LOGIN_FAILED', {
        provider,
        reason: authResult.error ?? 'Unknown error',
      })
    );
    // Redirect to login with error instead of returning JSON
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', authResult.error ?? 'Authentication failed');
    return NextResponse.redirect(loginUrl);
  }

  const { externalId, email, name } = authResult.user;

  // Try to find an existing local user
  const existingUser = findExistingUser(provider, externalId, email);
  let userId: string;
  let username: string;
  let role: string;
  let isNewUser = false;

  if (existingUser) {
    userId = existingUser.id;
    username = existingUser.username;
    role = existingUser.role;
  } else {
    // Create a new local user
    userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    // Derive username from name or email
    username = name.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
    role = 'user';
    isNewUser = true;

    externalUsers.set(userId, {
      id: userId,
      username,
      email,
      role,
      provider,
      externalId,
    });
  }

  // Generate JWT
  const token = authService.generateToken({ id: userId, username, role });

  // Set auth cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'lax' needed for OAuth redirects
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  // Audit log
  await logToAuditTrail(
    await createLogEntry('EXTERNAL_LOGIN_SUCCESS', {
      provider,
      userId,
      username,
      isNewUser,
    })
  );

  // Redirect to onboarding for new users, dashboard for existing
  const destination = isNewUser ? '/onboarding' : '/dashboard';
  return NextResponse.redirect(new URL(destination, request.url));
}

export const GET = withRateLimit(
  withErrorHandling(async (req: Request) => {
    // Extract provider from the URL path since withRateLimit/withErrorHandling
    // don't forward the Next.js route context cleanly
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const providerFromPath = pathSegments[pathSegments.length - 1];
    return handleCallback(req, {
      params: Promise.resolve({ provider: providerFromPath }),
    });
  }),
  '/api/auth/callback',
  RateLimitPresets.AUTH
);
