'use client';

/**
 * Global Error Boundary for the Root Layout
 *
 * This catches errors that occur in the root layout itself (app/layout.tsx),
 * including provider initialization failures. Without this file, Next.js shows
 * its built-in "Application Error" page with no useful recovery options.
 *
 * Note: global-error.tsx must render its own <html> and <body> tags because
 * the root layout may have failed to render.
 */

import { useEffect } from 'react';

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Clears all browser caches that could cause stale-asset boot failures:
 * - localStorage (corrupted tokens, seed data)
 * - sessionStorage
 * - Cache API (stale JS/CSS bundles)
 */
function clearAllCaches(): void {
  try {
    localStorage.clear();
  } catch {
    // localStorage may be unavailable
  }

  try {
    sessionStorage.clear();
  } catch {
    // sessionStorage may be unavailable
  }

  // Clear Cache API entries (stale bundles from previous deployments)
  if ('caches' in window) {
    caches
      .keys()
      .then(names => {
        for (const name of names) {
          caches.delete(name);
        }
      })
      .catch(() => {
        // Cache API may be unavailable
      });
  }

  // Unregister any service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      })
      .catch(() => {
        // Service worker API may be unavailable
      });
  }
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Structured error telemetry for debugging production issues
    console.error('[GlobalError] Root layout error caught:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [error]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCacheAndReload = () => {
    clearAllCaches();
    // Small delay to let async cache clearing finish
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#1a1a2e',
        }}
      >
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
            }}
          >
            {/* Error icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            {/* Error heading */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                margin: '0 0 0.5rem',
                color: '#1a1a2e',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 1.5rem',
                lineHeight: 1.6,
              }}
            >
              The application failed to load. This can happen due to a network issue or stale cached
              data. Try reloading, or clear the cache and reload if the problem persists.
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  width: '100%',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#6b7280',
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#ef4444',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
                {error.digest && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.5rem',
                    }}
                  >
                    Error ID: {error.digest}
                  </p>
                )}
              </details>
            )}

            {/* Recovery actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: '#4a6491',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={handleReload}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#1a1a2e',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
              <button
                onClick={handleClearCacheAndReload}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#ef4444',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Clear cache &amp; reload
              </button>
            </div>

            <p
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '1.5rem',
              }}
            >
              If this problem persists, please{' '}
              <a href="mailto:support@example.com" style={{ color: '#4a6491' }}>
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
