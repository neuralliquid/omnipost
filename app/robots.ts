/**
 * Robots.txt configuration using Next.js Metadata API
 * Uses NEXT_PUBLIC_SITE_URL for environment-aware domain.
 */

import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://nl-dev-omnipost-app-euw.azurewebsites.net';

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    rules: isProduction
      ? {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/', '/onboarding/'],
        }
      : {
          userAgent: '*',
          disallow: '/', // Block indexing of staging/dev
        },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
