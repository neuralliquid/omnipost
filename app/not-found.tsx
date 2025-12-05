/**
 * Not Found Page for App Router
 * Displayed when a page is not found (404)
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* 404 indicator */}
        <div className="space-y-2">
          <p className="text-7xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>

        {/* Suggestions */}
        <div className="pt-6 border-t">
          <p className="text-xs text-muted-foreground mb-3">
            Here are some helpful links:
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="text-sm text-primary hover:underline"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/review"
                className="text-sm text-primary hover:underline"
              >
                Content Review
              </Link>
            </li>
            <li>
              <Link
                href="/workflow"
                className="text-sm text-primary hover:underline"
              >
                Workflow
              </Link>
            </li>
            <li>
              <Link
                href="/platform-analysis"
                className="text-sm text-primary hover:underline"
              >
                Platform Analysis
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
