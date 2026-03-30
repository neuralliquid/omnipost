/**
 * Pricing Layout
 * Provides metadata for the pricing page.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - OmniPost',
  description:
    'Simple, transparent pricing for multi-platform content publishing. Start free, upgrade as you grow. No hidden fees, cancel anytime.',
  keywords: [
    'omnipost pricing',
    'content publishing pricing',
    'social media management plans',
    'multi-platform publishing cost',
  ],
  openGraph: {
    title: 'Pricing - OmniPost',
    description:
      'Simple, transparent pricing for multi-platform content publishing. Start free, upgrade as you grow.',
    url: 'https://omnipost.dev/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - OmniPost',
    description:
      'Simple, transparent pricing for multi-platform content publishing. Start free, upgrade as you grow.',
  },
};

export default function PricingLayout({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}
