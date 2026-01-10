/**
 * Root Layout for App Router
 * This layout wraps all pages in the app/ directory
 */

import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { SeedDataProvider } from '@/components/providers/SeedDataProvider';
import { ToastProvider } from '@/components/ui';

// Font configuration using CSS custom properties
// Note: Google Fonts (Inter) can be enabled when network access is available
// by importing { Inter } from 'next/font/google' and using inter.variable/className
const fontConfig = {
  variable: '--font-inter',
  className: 'font-sans',
};

export const metadata: Metadata = {
  title: {
    template: '%s | OmniPost',
    default: 'OmniPost',
  },
  description: 'AI-powered multi-platform content publishing. Publish everywhere, manage anywhere.',
  keywords: [
    'omnipost',
    'multi-platform',
    'publishing',
    'content creation',
    'AI',
    'automation',
    'social media',
  ],
  authors: [{ name: 'OmniPost Team' }],
  creator: 'OmniPost',
  publisher: 'OmniPost',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'OmniPost',
    title: 'OmniPost',
    description:
      'AI-powered multi-platform content publishing. Publish everywhere, manage anywhere.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OmniPost',
    description:
      'AI-powered multi-platform content publishing. Publish everywhere, manage anywhere.',
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

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className={fontConfig.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${fontConfig.className} min-h-screen bg-background font-sans antialiased`}>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>

        {/* Main content area with providers */}
        <ToastProvider>
          <SeedDataProvider>
            <div id="main-content" className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </SeedDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
