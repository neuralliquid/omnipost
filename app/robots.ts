/**
 * Robots.txt configuration using Next.js Metadata API
 */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://omnipost.dev/sitemap.xml',
  };
}
