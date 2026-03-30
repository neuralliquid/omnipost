import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { Errors, withErrorHandling } from '../_utils/errors';
import { validateString } from '../_utils/validation';
import { authService, User } from '../../../lib/auth/auth-service';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';

/**
 * Validates login input parameters
 * @param username Username to validate
 * @param password Password to validate
 * @returns Error response or null if valid
 */
async function validateLoginInput(
  username: string,
  password: string
): Promise<NextResponse | null> {
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
async function authenticateUser(username: string, password: string): Promise<User | NextResponse> {
  // Log the login attempt (without the password)
  await logToAuditTrail(await createLogEntry('LOGIN_ATTEMPT', { username }));

  // Find user
  const user = await authService.findUserByUsername(username);
  if (!user) {
    await logToAuditTrail(
      await createLogEntry('LOGIN_FAILED', { username, reason: 'User not found' })
    );
    return Errors.unauthorized('Invalid username or password');
  }

  // Verify credentials
  const isPasswordValid = await authService.verifyUserCredentials(username, password);
  if (!isPasswordValid) {
    await logToAuditTrail(
      await createLogEntry('LOGIN_FAILED', { username, reason: 'Invalid password' })
    );
    return Errors.unauthorized('Invalid username or password');
  }

  return user;
}

/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
function generateToken(user: User): string {
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
    path: '/',
  });
}

// In-memory user store for alpha registration
const registeredUsers = new Map<string, { id: string; username: string; email: string; passwordHash: string; role: string }>();

/**
 * Handles user registration
 * @param request Request object
 * @returns Response with JWT token and user info
 */
async function handleRegister(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate required fields
    const usernameError = validateString(username, 'Username');
    if (usernameError) {
      return Errors.badRequest(usernameError);
    }

    const emailError = validateString(email, 'Email');
    if (emailError) {
      return Errors.badRequest(emailError);
    }

    const passwordError = validateString(password, 'Password');
    if (passwordError) {
      return Errors.badRequest(passwordError);
    }

    // Validate password length
    if (typeof password === 'string' && password.length < 8) {
      return Errors.badRequest('Password must be at least 8 characters');
    }

    // Check if username already exists (hardcoded admin or in-memory store)
    const existingUser = await authService.findUserByUsername(username);
    if (existingUser || registeredUsers.has(username)) {
      return Errors.badRequest('Username already exists');
    }

    // Hash password
    let passwordHash: string;
    try {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(password, 10);
    } catch {
      // Fallback for alpha: store password as-is in memory (dev only)
      if (process.env.NODE_ENV === 'production') {
        return Errors.internalServerError('Password hashing unavailable');
      }
      passwordHash = password;
    }

    // Create user in-memory for alpha
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newUser: User = {
      id: userId,
      username,
      role: 'user',
    };

    registeredUsers.set(username, {
      id: userId,
      username,
      email,
      passwordHash,
      role: 'user',
    });

    // Log registration
    await logToAuditTrail(await createLogEntry('REGISTER_SUCCESS', { username, userId }));

    // Generate JWT token
    const token = generateToken(newUser);

    // Set HTTP-only cookie with the token
    await setAuthCookie(token);

    return NextResponse.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Errors.internalServerError('An error occurred during registration');
  }
}

// Login endpoint - handle login request
async function handleLogin(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, username, password, email } = body;

    // Route to registration if action is 'register'
    if (action === 'register') {
      // Re-create the request with the body for handleRegister
      const registerBody = JSON.stringify({ username, email, password });
      const registerRequest = new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: registerBody,
      });
      return handleRegister(registerRequest);
    }

    // Validate input
    const validationError = await validateLoginInput(username, password);
    if (validationError) {
      return validationError;
    }

    // Check in-memory registered users first
    const registeredUser = registeredUsers.get(username);
    if (registeredUser) {
      let isValid = false;
      try {
        const bcrypt = await import('bcryptjs');
        isValid = await bcrypt.compare(password, registeredUser.passwordHash);
      } catch {
        // Dev fallback: plain comparison
        isValid = password === registeredUser.passwordHash;
      }

      if (!isValid) {
        return Errors.unauthorized('Invalid username or password');
      }

      const user: User = {
        id: registeredUser.id,
        username: registeredUser.username,
        role: registeredUser.role,
      };

      const token = generateToken(user);
      await setAuthCookie(token);
      await logToAuditTrail(await createLogEntry('LOGIN_SUCCESS', { username, userId: user.id }));

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }

    // Authenticate user (existing flow)
    const userOrError = await authenticateUser(username, password);
    // Check if authentication returned an error response (NextResponse)
    if (userOrError && typeof userOrError === 'object' && 'status' in userOrError) {
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
        role: user.role,
      },
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
      path: '/',
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
