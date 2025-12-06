/**
 * Series Management Page - App Router
 * Manages content series with client-side state
 */

import { Metadata } from 'next';
import SeriesContent from './SeriesContent';

export const metadata: Metadata = {
  title: 'Manage Content Series',
  description:
    'Create and manage your technical content series for better planning and distribution.',
};

export default function SeriesPage() {
  return <SeriesContent />;
}
