/**
 * AuthService Unit Tests - NEW-02 / Phase 7 Fixes Verification
 *
 * Tests covering BUG-03 (async auth), BUG-08 (null checks),
 * and MEM-01 (bounded token blacklist)
 */

import { AuthService } from '@/lib/auth/auth-service';
import jwt from 'jsonwebtoken';

// Mock JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token structure
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include user data in token payload', () => {
      const user = { id: '123', username: 'admin', role: 'admin' };
      const token = authService.generateToken(user);
      const decoded = jwt.decode(token) as { id: string; username: string; role: string };

      expect(decoded.id).toBe('123');
      expect(decoded.username).toBe('admin');
      expect(decoded.role).toBe('admin');
    });
  });

  describe('verifyToken - BUG-08 Fix Verification', () => {
    it('should return null for invalid token', () => {
      const result = authService.verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      // Generate token that expires in 1 second
      const token = authService.generateToken(user, '1s');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = authService.verifyToken(token);
      expect(result).toBeNull();
    });

    it('should return payload for valid token', () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      const token = authService.generateToken(user);
      const result = authService.verifyToken(token);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.username).toBe('testuser');
      expect(result?.role).toBe('user');
    });

    it('should return null for token with missing required fields', () => {
      // Create a token manually without required fields
      const invalidPayload = { foo: 'bar' };
      const token = jwt.sign(invalidPayload, process.env.JWT_SECRET!);

      const result = authService.verifyToken(token);
      expect(result).toBeNull();
    });
  });

  describe('Token Blacklist - MEM-01 Fix Verification', () => {
    it('should blacklist a token', () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      const token = authService.generateToken(user);

      // Add to blacklist
      authService.addToTokenBlacklist(token, 3600);

      expect(authService.isTokenBlacklisted(token)).toBe(true);
    });

    it('should reject blacklisted tokens on verify', () => {
      // Use unique user ID to generate unique token that isn't already blacklisted
      const uniqueId = `blacklist-test-${Date.now()}`;
      const user = { id: uniqueId, username: 'testuser', role: 'user' };
      const token = authService.generateToken(user);

      // Verify works before blacklisting
      expect(authService.verifyToken(token)).not.toBeNull();

      // Add to blacklist
      authService.addToTokenBlacklist(token, 3600);

      // Verify returns null after blacklisting
      expect(authService.verifyToken(token)).toBeNull();
    });

    it('should not mark non-blacklisted token as blacklisted', () => {
      const token = 'some-random-token';
      expect(authService.isTokenBlacklisted(token)).toBe(false);
    });
  });
});
