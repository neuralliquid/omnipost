'use client';

/**
 * Dashboard Error Boundary
 * Handles errors in dashboard routes
 */

import { useEffect } from 'react';
import styles from '@/styles/ErrorBoundary.module.css';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardError] Error caught:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
  }, [error]);

  return (
    <div className={styles.errorContainer} role="alert">
      <div className={styles.errorIcon}>
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className={styles.errorTitle}>Something went wrong!</h2>
      <p className={styles.errorMessage}>
        {process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again.'
          : error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {error.digest && (
        <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '1rem' }}>
          Error ID: {error.digest}
        </p>
      )}
      {process.env.NODE_ENV === 'development' && error.stack && (
        <details className={styles.errorDetails}>
          <summary>Error Details</summary>
          <pre className={styles.errorStack}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
      <div className={styles.errorActions}>
        <button type="button" onClick={reset} className={styles.retryButton}>
          Try again
        </button>
        <a href="/" className={styles.reloadButton}>
          Go home
        </a>
      </div>
    </div>
  );
}
