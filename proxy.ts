import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT_SECRET is optional at startup to allow health checks and deployment verification
// Authentication will fail gracefully if JWT_SECRET is missing when needed
const JWT_SECRET = process.env.JWT_SECRET;

// Define paths that require authentication
const authenticatedPaths = [
  '/api/platforms',
  '/api/queue',
  '/api/images',
  '/api/parse',
  '/api/summarize',
  '/api/content',
  '/api/feedback',
  '/api/notifications',
  '/api/scheduler',
];

// Define paths that require admin authentication
const adminPaths = ['/api/feature-flags', '/api/audit'];

/**
 * Extract token from request
 */
function getToken(request: NextRequest): string | null {
  // Try cookie first
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Try authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Create unauthorized response
 */
function createUnauthorizedResponse(message: string): NextResponse {
  return new NextResponse(JSON.stringify({ message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create forbidden response
 */
function createForbiddenResponse(message: string): NextResponse {
  return new NextResponse(JSON.stringify({ message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verify and decode JWT token
 */
function verifyToken(token: string): jwt.JwtPayload | null {
  // If JWT_SECRET is not configured, authentication cannot be performed
  if (!JWT_SECRET) {
    console.warn('JWT_SECRET not configured - authentication unavailable');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Check if path requires authentication
 */
function requiresAuthentication(pathname: string): { auth: boolean; admin: boolean } {
  const requiresAdmin = adminPaths.some(path => pathname.startsWith(path));
  const requiresAuth = authenticatedPaths.some(path => pathname.startsWith(path)) || requiresAdmin;

  return { auth: requiresAuth, admin: requiresAdmin };
}

/**
 * Handle authenticated request
 */
function handleAuthenticatedRequest(
  request: NextRequest,
  decoded: jwt.JwtPayload,
  requiresAdmin: boolean
): NextResponse {
  // Check admin privileges if needed
  if (requiresAdmin && decoded.role !== 'admin') {
    return createForbiddenResponse('Admin privileges required');
  }

  // Add user info to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.id as string);
  requestHeaders.set('x-user-role', decoded.role as string);
  requestHeaders.set('x-user-name', decoded.username as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for non-API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if the path requires authentication
  const { auth: requiresAuth, admin: requiresAdmin } = requiresAuthentication(pathname);

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // If JWT_SECRET is not configured, authentication cannot be performed
  if (!JWT_SECRET) {
    console.warn(
      `JWT_SECRET not configured - authentication required for ${pathname} but unavailable`
    );
    return createUnauthorizedResponse(
      'Authentication service unavailable - JWT_SECRET not configured'
    );
  }

  // Get authentication token
  const token = getToken(request);
  if (!token) {
    return createUnauthorizedResponse('Authentication required');
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createUnauthorizedResponse('Invalid or expired authentication token');
  }

  // Handle authenticated request
  return handleAuthenticatedRequest(request, decoded, requiresAdmin);
}

// Configure the proxy to run only on API routes
export const config = {
  matcher: '/api/:path*',
};
