import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { Errors, withErrorHandling } from '../_utils/errors';
import { validateString } from '../_utils/validation';
import { authService } from '../../../lib/auth/auth-service';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';

// Import Request type from Next.js
import type { NextRequest } from 'next/server';

/**
 * Validates login input parameters
 * @param username Username to validate
 * @param password Password to validate
 * @returns Error response or null if valid
 */
async function validateLoginInput(username: string, password: string): Promise<NextResponse | null> {
  // Validate username
  const usernameError = validateString(username, 'Username');
  if (usernameError) {
    return Errors.badRequest(usernameError);
  }
    
  // Validate password
  const passwordError = validateString(password, 'Password');
  if (passwordError) {
    return Errors.badRequest(passwordError);
  }
    
  return null;
}

/**
 * Authenticates a user
 * @param username Username to authenticate
 * @param password Password to verify
 * @returns User object or error response
 */
async function authenticateUser(username: string, password: string): Promise<any | NextResponse> {
  // Log the login attempt (without the password)
  await logToAuditTrail(await createLogEntry('LOGIN_ATTEMPT', { username }));
    
  // Find user
  const user = await authService.findUserByUsername(username);
  if (!user) {
    await logToAuditTrail(await createLogEntry('LOGIN_FAILED', { username, reason: 'User not found' }));
    return Errors.unauthorized('Invalid username or password');
  }
    
  // Verify credentials
  const isPasswordValid = await authService.verifyUserCredentials(username, password);
  if (!isPasswordValid) {
    await logToAuditTrail(await createLogEntry('LOGIN_FAILED', { username, reason: 'Invalid password' }));
    return Errors.unauthorized('Invalid username or password');
  }
    
  return user;
}

/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
function generateToken(user: any): string {
  return authService.generateToken(user);
}
    
/**
 * Sets the authentication cookie
 * @param token JWT token
 */
async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
}
    
// Login endpoint - handle login request
async function handleLogin(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // Validate input
    const validationError = await validateLoginInput(username, password);
    if (validationError) {
      return validationError;
    }
    
    // Authenticate user
    const userOrError = await authenticateUser(username, password);
    if (userOrError instanceof NextResponse) {
      return userOrError; // Return error response if authentication failed
    }
    
    const user = userOrError;
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set HTTP-only cookie with the token
    await setAuthCookie(token);
    // Log successful login
    await logToAuditTrail(await createLogEntry('LOGIN_SUCCESS', { username, userId: user.id }));
    
    // Return token and basic user info (omitting sensitive data)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return Errors.internalServerError('An error occurred during login');
  }
}

// Logout endpoint - handle logout request
async function handleLogout(): Promise<NextResponse> {
  try {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
  
    // Log the logout
    await logToAuditTrail(await createLogEntry('LOGOUT'));
  
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return Errors.internalServerError('An error occurred during logout');
  }
}

// Export route handlers with proper error handling and rate limiting
// Auth endpoint uses strict rate limiting to prevent brute force attacks
export const POST = withRateLimit(
  withErrorHandling(async (req: Request) => handleLogin(req)),
  '/api/auth',
  RateLimitPresets.AUTH
);

export const DELETE = withErrorHandling(async (_req: Request) => handleLogout());
