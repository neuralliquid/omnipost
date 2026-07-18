/**
 * Auth Provider
 * Provides authentication state across the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStorage } from '@/lib/storage/token-storage';
import { apiClient } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface StoredTokenPayload {
  id?: string;
  username?: string;
  role?: string;
  exp?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token or cookie-backed session on mount
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        const token = tokenStorage.getToken();
        if (token) {
          // Try to decode the token to get user info
          try {
            const parts = token.split('.');
            if (parts.length !== 3) {
              throw new Error('Malformed JWT: expected 3 parts');
            }
            const payload = JSON.parse(atob(parts[1])) as StoredTokenPayload;
            if (
              payload?.exp &&
              payload.exp * 1000 > Date.now() &&
              payload.id &&
              payload.username &&
              payload.role
            ) {
              setUser({
                id: payload.id,
                username: payload.username,
                role: payload.role,
              });
              return;
            }

            // Token expired, remove it
            tokenStorage.removeToken();
          } catch {
            // Invalid token, remove it
            console.warn('[AuthProvider] Removed invalid auth token from storage');
            tokenStorage.removeToken();
          }
        }

        const session = await apiClient.getSession();
        if (session.authenticated && session.user) {
          setUser(session.user);
        }
      } catch (error) {
        // localStorage/session restoration can fail. Log and continue - the user simply won't be authenticated.
        console.error('[AuthProvider] Failed to restore auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (globalThis.window === undefined) {
      setIsLoading(false);
      return;
    }

    void restoreAuthState();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiClient.login(username, password);
    if (result?.user) {
      setUser({
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore logout errors
    }
    tokenStorage.removeToken();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
