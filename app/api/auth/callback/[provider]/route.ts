/**
 * GET /api/auth/callback/[provider]
 *
 * Starts and completes external identity provider callbacks.
 */

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../../../_utils/audit';
import { Errors, withErrorHandling } from '../../../_utils/errors';
import { withRateLimit, RateLimitPresets } from '../../../_utils/rateLimit';
import { authService } from '../../../../../lib/auth/auth-service';
import {
  handleAuthCallback,
  initiateExternalAuth,
} from '../../../../../lib/auth/identity-provider';

const OAUTH_STATE_COOKIE_PREFIX = 'oauth-state-';

interface ExternalUserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  provider: string;
  externalId: string;
}

interface StoredOAuthState {
  state: string;
  redirect: string;
}

/**
 * In-memory store for users created via external providers.
 * In production this should be backed by a database.
 */
const externalUsers = new Map<string, ExternalUserRecord>();

/**
 * Find an existing user by external provider + external ID, or by email.
 */
function findExistingUser(
  provider: string,
  externalId: string,
  email: string
): { id: string; username: string; role: string; isNew: false } | null {
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

function parseSafeRedirect(value: string, origin: string): string {
  try {
    const redirectUrl = new URL(value, origin);
    if (redirectUrl.origin !== origin) {
      return '/dashboard';
    }
    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return '/dashboard';
  }
}

function parseStoredOAuthState(value: string | undefined): StoredOAuthState | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredOAuthState>;
    if (typeof parsed.state !== 'string' || typeof parsed.redirect !== 'string') {
      return null;
    }
    return { state: parsed.state, redirect: parsed.redirect };
  } catch {
    return null;
  }
}

async function handleCallback(
  request: Request,
  context?: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  if (!context) {
    return Errors.badRequest('Missing route context');
  }

  const { provider } = await context.params;
  if (!provider || provider.length > 50) {
    return Errors.badRequest('Invalid provider');
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const callbackUrl = new URL(url.pathname, url.origin).toString();
  const cookieStore = await cookies();
  const stateCookieName = `${OAUTH_STATE_COOKIE_PREFIX}${provider}`;

  if (!code) {
    const state = randomBytes(24).toString('base64url');
    const requestedRedirect = url.searchParams.get('redirect') || '/dashboard';
    const redirect = await initiateExternalAuth(provider, callbackUrl, state);

    if (!redirect) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Mystira Identity sign-in is unavailable');
      return NextResponse.redirect(loginUrl);
    }

    cookieStore.set({
      name: stateCookieName,
      value: JSON.stringify({
        state,
        redirect: parseSafeRedirect(requestedRedirect, url.origin),
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });

    return NextResponse.redirect(redirect.redirectUrl);
  }

  const storedState = parseStoredOAuthState(cookieStore.get(stateCookieName)?.value);
  cookieStore.delete(stateCookieName);
  if (!storedState || storedState.state !== url.searchParams.get('state')) {
    return Errors.badRequest('Invalid OAuth state');
  }

  const authResult = await handleAuthCallback(provider, code, callbackUrl);

  if (!authResult.success || !authResult.user) {
    await logToAuditTrail(
      await createLogEntry('EXTERNAL_LOGIN_FAILED', {
        provider,
        reason: authResult.error ?? 'Unknown error',
      })
    );
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', authResult.error ?? 'Authentication failed');
    return NextResponse.redirect(loginUrl);
  }

  const { externalId, email, name } = authResult.user;
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
    userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  const token = authService.generateToken({ id: userId, username, role });

  cookieStore.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  });

  await logToAuditTrail(
    await createLogEntry('EXTERNAL_LOGIN_SUCCESS', {
      provider,
      userId,
      username,
      isNewUser,
    })
  );

  return NextResponse.redirect(new URL(storedState.redirect, request.url));
}

export const GET = withRateLimit(
  withErrorHandling(async (req: Request) => {
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
