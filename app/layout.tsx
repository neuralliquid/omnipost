/**
 * Root Layout for App Router
 * This layout wraps all pages in the app/ directory
 */

import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Content Creation Platform',
    default: 'Content Creation Platform',
  },
  description: 'AI-powered content creation and multi-platform publishing',
  keywords: ['content creation', 'AI', 'publishing', 'automation'],
  authors: [{ name: 'Content Creation Team' }],
  creator: 'Content Creation Platform',
  publisher: 'Content Creation Platform',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Content Creation Platform',
    title: 'Content Creation Platform',
    description: 'AI-powered content creation and multi-platform publishing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Content Creation Platform',
    description: 'AI-powered content creation and multi-platform publishing',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>

        {/* Main content area */}
        <div id="main-content" className="relative flex min-h-screen flex-col">
          {children}
        </div>

        {/* Toast container for notifications */}
        <div id="toast-container" aria-live="polite" aria-atomic="true" />
      </body>
    </html>
  );
}
