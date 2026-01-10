'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { useRouter } from 'next/navigation';
import styles from '@/styles/LoginForm.module.css';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface LoginFormProps {
  onLoginSuccess?: (user: User) => void;
  redirectPath?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, redirectPath = '/dashboard' }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the API client for authentication
      const result = await apiClient.login(username, password);

      // Handle successful login
      if (result?.user) {
        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }

        // Redirect to the specified path if provided
        if (redirectPath) {
          router.push(redirectPath);
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2 className={styles.title}>Login</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className={styles.input}
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
