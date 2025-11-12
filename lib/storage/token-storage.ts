/**
 * Token Storage Service
 * Handles secure storage and retrieval of authentication tokens
 * Following Single Responsibility Principle (SRP)
 */

const TOKEN_KEY = 'auth-token';

/**
 * Interface for token storage operations
 */
export interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
}

/**
 * Browser-based token storage implementation using localStorage
 */
class BrowserTokenStorage implements ITokenStorage {
  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Get the authentication token from storage
   */
  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return window.localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store the authentication token
   */
  setToken(token: string): void {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Remove the authentication token from storage
   */
  removeToken(): void {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Export singleton instance
 */
export const tokenStorage: ITokenStorage = new BrowserTokenStorage();
