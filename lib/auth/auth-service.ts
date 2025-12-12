import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';

// User interfaces
export interface User {
  id: string;
  username: string;
  role: string;
  isAdmin?: boolean;
}

export interface TokenPayload extends JwtPayload {
  id: string;
  username: string;
  role: string;
}

// In-memory token blacklist (replace with Redis or another database in production)
const tokenBlacklist = new Map<string, number>();

/**
 * Authentication service for handling JWT operations and user authentication
 */
export class AuthService {
  /**
   * Get JWT secret from environment variables
   * @returns JWT secret
   * @throws Error if JWT_SECRET is not set
   */
  private getJwtSecret(): string {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secretKey;
  }

  /**
   * Generate a JWT token for a user
   * @param user User object
   * @param expiresIn Token expiration time (default: 1h)
   * @returns JWT token
   */
  public generateToken(user: User, expiresIn = '1h'): string {
    const secret = this.getJwtSecret();
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }
    // JWT library accepts expiresIn as a string (e.g., '1h', '7d') or number (seconds)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      secret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
    return token;
  }

  /**
   * Verify a JWT token
   * @param token JWT token
   * @returns Decoded token payload or null if invalid
   */
  public verifyToken(token: string): TokenPayload | null {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        return null;
      }

      const decoded = jwt.verify(token, this.getJwtSecret()) as TokenPayload;

      // Check if token has expired
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
   * Get user from request (using cookies or authorization header)
   * @returns User object or null if not authenticated
   */
  public getCurrentUser(): User | null {
    try {
      // Try to get token from cookies first
      const cookieStore = cookies();
      const tokenFromCookie = (cookieStore as any).get?.('auth-token')?.value;

      // If no cookie, try to get from authorization header
      const headersList = headers();
      const authHeader = (headersList as any).get?.('authorization');
      const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;

      // Use whichever token is available
      const token = tokenFromCookie || tokenFromHeader;

      if (!token) {
        return null;
      }

      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      return {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        isAdmin: decoded.role === 'admin',
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token JWT token
   * @returns Boolean indicating if token is blacklisted
   */
  public isTokenBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  }

  /**
   * Add a token to the blacklist
   * @param token JWT token
   * @param expiryTime Time in seconds until token expiration
   */
  public addToTokenBlacklist(token: string, expiryTime: number): void {
    tokenBlacklist.set(token, Date.now() + expiryTime * 1000);

    // Clean up expired tokens from blacklist
    this.cleanupBlacklist();
  }

  /**
   * Clean up expired tokens from blacklist
   */
  private cleanupBlacklist(): void {
    const now = Date.now();
    for (const [token, expiry] of tokenBlacklist.entries()) {
      if (expiry < now) {
        tokenBlacklist.delete(token);
      }
    }
  }

  /**
   * Find a user by username
   * @param username Username to search for
   * @returns User object or null if not found
   *
   * NOTE: This is a placeholder implementation.
   * In production, replace with actual database lookup (e.g., Prisma, Drizzle).
   */
  public async findUserByUsername(username: string): Promise<User | null> {
    // TODO: Replace with actual database lookup
    // Example with Prisma:
    // const user = await prisma.user.findUnique({ where: { username } });
    // return user;

    // For development, check environment variables for test users
    const testUsername = process.env.TEST_USER_USERNAME;
    const testUserRole = process.env.TEST_USER_ROLE || 'user';

    if (testUsername && username === testUsername) {
      return {
        id: 'test-user-1',
        username: testUsername,
        role: testUserRole,
      };
    }

    // No user found - in production this would query the database
    return null;
  }

  /**
   * Verify user credentials
   * @param username Username
   * @param password Password
   * @returns Boolean indicating if credentials are valid
   *
   * NOTE: This is a placeholder implementation.
   * In production, use proper password hashing (bcrypt, argon2) and database lookup.
   */
  public async verifyUserCredentials(username: string, password: string): Promise<boolean> {
    // TODO: Replace with actual database lookup and password verification
    // Example with bcrypt:
    // const user = await this.findUserByUsername(username);
    // if (!user) return false;
    // return bcrypt.compare(password, user.passwordHash);

    // For development/testing only - credentials from environment variables
    const testUsername = process.env.TEST_USER_USERNAME;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testUsername || !testPassword) {
      // No test credentials configured - authentication disabled
      console.warn('No authentication credentials configured. Set TEST_USER_USERNAME and TEST_USER_PASSWORD environment variables for development.');
      return false;
    }

    return username === testUsername && password === testPassword;
  }
}

// Export singleton instance
export const authService = new AuthService();
