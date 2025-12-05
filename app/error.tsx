'use client';

/**
 * Error Boundary Component for App Router
 * Catches errors in the application and provides recovery options
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);

    // In production, you might want to send this to an error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   reportError(error);
    // }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" role="alert">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
          </p>
        </div>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-2">Error details:</p>
            <pre className="text-xs text-destructive overflow-auto max-h-32">{error.message}</pre>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Go home
          </a>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          If this problem persists, please{' '}
          <a href="mailto:support@example.com" className="text-primary hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
