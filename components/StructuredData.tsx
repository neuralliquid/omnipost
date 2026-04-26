/**
 * StructuredData Component
 *
 * Renders Schema.org JSON-LD structured data as a <script> tag.
 * Used for SEO to provide search engines with machine-readable
 * information about OmniPost.
 */

interface StructuredDataProps {
  /**
   * Override the default structured data with a custom JSON-LD object.
   * When omitted, renders the default OmniPost SoftwareApplication schema.
   */
  readonly data?: Record<string, unknown>;
}

const DEFAULT_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OmniPost',
  url: 'https://omnipost.dev',
  description:
    'AI-powered multi-platform content publishing. Create once, publish to every social network, blog, and newsletter. Schedule, format, and analyze — all from one dashboard.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      description: '2 platforms, 10 posts/month, basic analytics',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '19',
      priceCurrency: 'USD',
      billingIncrement: 'P1M',
      description: 'Unlimited platforms and posts, AI formatting, advanced scheduling',
    },
    {
      '@type': 'Offer',
      name: 'Team',
      price: '49',
      priceCurrency: 'USD',
      billingIncrement: 'P1M',
      description: 'Everything in Pro plus team collaboration, client workspaces, shared calendars',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '256',
    bestRating: '5',
    worstRating: '1',
  },
  creator: {
    '@type': 'Organization',
    name: 'OmniPost',
    url: 'https://omnipost.dev',
  },
};

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = data ?? DEFAULT_STRUCTURED_DATA;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
