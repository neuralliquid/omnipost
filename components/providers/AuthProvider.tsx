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

  // Check for existing token on mount
  useEffect(() => {
    if (globalThis.window === undefined) {
      setIsLoading(false);
      return;
    }

    const token = tokenStorage.getToken();
    if (token) {
      // Try to decode the token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.id,
            username: payload.username,
            role: payload.role,
          });
        } else {
          // Token expired, remove it
          tokenStorage.removeToken();
        }
      } catch {
        // Invalid token, remove it
        tokenStorage.removeToken();
      }
    }
    setIsLoading(false);
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
