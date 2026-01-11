'use client';

/**
 * Marketing Error Boundary
 * Handles errors in marketing routes
 */

import { useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/ErrorBoundary.module.css';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function MarketingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Marketing error:', error);
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
      <h2 className={styles.errorTitle}>Oops!</h2>
      <p className={styles.errorMessage}>Something went wrong while loading this page.</p>
      {process.env.NODE_ENV === 'development' && error.message && (
        <details className={styles.errorDetails}>
          <summary>Error Details</summary>
          <pre className={styles.errorStack}>
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}
      <div className={styles.errorActions}>
        <button type="button" onClick={reset} className={styles.retryButton}>
          Try again
        </button>
        <Link href="/" className={styles.reloadButton}>
          Go home
        </Link>
      </div>
    </div>
  );
}
