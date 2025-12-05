/**
 * Landing Page (App Router)
 * Static page with SSG for optimal performance
 */

import { Metadata } from 'next';
import Hero from '@/components/ui/Hero';

export const metadata: Metadata = {
  title: 'Content Creation Platform',
  description: 'AI-powered content creation and multi-platform publishing. Transform your content workflow with automated parsing, summarization, and image generation.',
  keywords: ['content creation', 'AI', 'publishing', 'automation', 'multi-platform'],
  openGraph: {
    title: 'Content Creation Platform',
    description: 'AI-powered content creation and multi-platform publishing',
    type: 'website',
  },
};

export default function HomePage() {
  return <Hero />;
}
