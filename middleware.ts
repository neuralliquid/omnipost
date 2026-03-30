/**
 * Next.js Middleware
 *
 * Validates JWT tokens from cookies or Authorization headers and injects
 * user identity headers (x-user-id, x-user-name, x-user-role) into
 * the request for downstream API route handlers.
 *
 * This bridges the gap between the auth token and the header-based
 * auth checks in app/api/_utils/auth.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  username: string;
  role: string;
  exp?: number;
}

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Try to get token from cookie first, then Authorization header
  const tokenFromCookie = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return response;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return response;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Validate required fields
    if (!decoded || !decoded.id || !decoded.username || !decoded.role) {
      return response;
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return response;
    }

    // Inject user identity headers for downstream route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-user-name', decoded.username);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Invalid token — continue without user headers
    return response;
  }
}

export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match dashboard routes
    '/(dashboard)/:path*',
  ],
};
