/**
 * Pricing Layout
 * Provides metadata and structured data for the pricing page.
 */

import type { Metadata } from 'next';
import { StructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for multi-platform content publishing. Free plan forever, Pro at $19/mo, Team at $49/mo. No hidden fees, 14-day free trial, cancel anytime.',
  keywords: [
    'omnipost pricing',
    'content publishing pricing',
    'social media management plans',
    'multi-platform publishing cost',
    'free content publishing tool',
    'social media scheduler pricing',
  ],
  openGraph: {
    title: 'Pricing — OmniPost',
    description:
      'Simple, transparent pricing for multi-platform content publishing. Start free, upgrade as you grow. No hidden fees, cancel anytime.',
    url: 'https://omnipost.dev/pricing',
    type: 'website',
    locale: 'en_US',
    siteName: 'OmniPost',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — OmniPost',
    description:
      'Simple, transparent pricing for multi-platform content publishing. Start free, upgrade as you grow.',
  },
  alternates: {
    canonical: 'https://omnipost.dev/pricing',
  },
};

const pricingStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'OmniPost Pricing',
  url: 'https://omnipost.dev/pricing',
  description:
    'Simple, transparent pricing for multi-platform content publishing.',
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'OmniPost',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
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
        description:
          'Unlimited platforms and posts, AI formatting, advanced scheduling',
      },
      {
        '@type': 'Offer',
        name: 'Team',
        price: '49',
        priceCurrency: 'USD',
        billingIncrement: 'P1M',
        description:
          'Everything in Pro plus team collaboration, client workspaces, shared calendars',
      },
    ],
  },
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is there really a free plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! The Free plan is free forever with no credit card required. It includes 2 platforms and 10 posts per month.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the 14-day free trial work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you sign up for Pro or Team, you get full access for 14 days. No credit card required. Your account reverts to Free if you don\'t continue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I switch plans at any time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Upgrade, downgrade, or cancel at any time. Upgrades take effect immediately; downgrades apply at end of billing period.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to my content if I cancel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your content is always yours. You retain access to published content and can export data at any time.',
      },
    },
  ],
};

export default function PricingLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={pricingStructuredData} />
      <StructuredData data={faqStructuredData} />
      {children}
    </>
  );
}
