/**
 * Landing Page (App Router)
 * Static page with SSG for optimal performance
 */

import { Metadata } from 'next';
import Hero from '@/components/ui/Hero';

export const metadata: Metadata = {
  title: 'OmniPost',
  description:
    'AI-powered multi-platform content publishing. Publish everywhere, manage anywhere. Transform your content workflow with automated parsing, summarization, and image generation.',
  keywords: [
    'omnipost',
    'multi-platform',
    'publishing',
    'content creation',
    'AI',
    'automation',
    'social media',
  ],
  openGraph: {
    title: 'OmniPost',
    description:
      'AI-powered multi-platform content publishing. Publish everywhere, manage anywhere.',
    type: 'website',
  },
};

export default function HomePage() {
  return <Hero />;
}
