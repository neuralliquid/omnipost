import { authService } from '../../lib/auth/auth-service';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  describe('token blacklisting', () => {
    it('should add a token to the blacklist and verify it is blacklisted', () => {
      const token = 'test-token';
      authService.addToTokenBlacklist(token, 3600);
      expect(authService.isTokenBlacklisted(token)).toBe(true);
    });

    it('should not verify a blacklisted token', () => {
        const user = { id: '1', username: 'admin', role: 'admin' };
        const token = authService.generateToken(user);
        authService.addToTokenBlacklist(token, 3600);
        const decoded = authService.verifyToken(token);
        expect(decoded).toBeNull();
    });
  });

  describe('verifyUserCredentials', () => {
    it('should return true for valid credentials', async () => {
      const result = await authService.verifyUserCredentials('admin', 'admin123');
      expect(result).toBe(true);
    });

    it('should return false for invalid credentials', async () => {
      const result = await authService.verifyUserCredentials('admin', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should return false for a non-existent user', async () => {
      const result = await authService.verifyUserCredentials('nonexistent', 'password');
      expect(result).toBe(false);
    });
  });

  describe('password hashing', () => {
    it('should hash passwords correctly', async () => {
        const user = await authService.findUserByUsername('admin');
        const password = 'admin123';
        const hashedPassword = (user as any).password;
        const match = await bcrypt.compare(password, hashedPassword);
        expect(match).toBe(true);
    });
  });
});
