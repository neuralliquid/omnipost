import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents white screen of death and provides user-friendly error UI
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // TODO: Log to error monitoring service (e.g., Sentry, DataDog) in Wave 2
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

    this.setState({ errorInfo });
  }

  handleReload = () => {
    globalThis.location.reload();
  };

  handleGoHome = () => {
    globalThis.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h1
              style={{
                color: '#2c3e50',
                marginBottom: '1rem',
                fontSize: '2rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: '#333',
                marginBottom: '2rem',
                lineHeight: '1.6',
              }}
            >
              We're sorry, but something unexpected happened. Our team has been notified and is
              working to fix the issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginBottom: '2rem',
                  textAlign: 'left',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                  }}
                >
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    overflow: 'auto',
                    padding: '0.5rem',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4a6491',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#3a5481')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4a6491')}
                onFocus={e => (e.currentTarget.style.backgroundColor = '#3a5481')}
                onBlur={e => (e.currentTarget.style.backgroundColor = '#4a6491')}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#4a6491',
                  border: '2px solid #4a6491',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                onFocus={e => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onBlur={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
