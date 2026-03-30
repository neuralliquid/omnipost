/**
 * Signup Page
 * Clean, minimal signup with benefit bullets and trust signals.
 * Uses existing auth API (POST /api/auth with action: 'register').
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/ui/Header';
import { tokenStorage } from '@/lib/storage/token-storage';
import styles from '@/styles/Signup.module.css';

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data: RegisterResponse | { message?: string } = await response.json();

      if (!response.ok) {
        const errorData = data as { message?: string };
        throw new Error(errorData.message ?? 'Registration failed');
      }

      const successData = data as RegisterResponse;

      // Store the token
      tokenStorage.setToken(successData.token);

      // Redirect to onboarding
      router.push('/onboarding');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.headline}>Start Publishing Everywhere</h1>
          <p className={styles.subheadline}>
            Create once, publish to every platform in seconds.
          </p>

          <ul className={styles.benefits}>
            <li className={styles.benefitItem}>
              <span className={styles.benefitIcon}>&#10003;</span>
              Multi-platform publishing
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.benefitIcon}>&#10003;</span>
              AI-powered formatting
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.benefitIcon}>&#10003;</span>
              Analytics dashboard
            </li>
          </ul>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error.replace(/[<>]/g, '')}
            </div>
          )}

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
                placeholder="Choose a username"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
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
                placeholder="At least 8 characters"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className={styles.loginLink}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>

          <div className={styles.trustSignals}>
            <span className={styles.trustItem}>Free forever plan</span>
            <span className={styles.trustDot}>&bull;</span>
            <span className={styles.trustItem}>No credit card required</span>
          </div>
        </div>
      </main>
    </>
  );
}
