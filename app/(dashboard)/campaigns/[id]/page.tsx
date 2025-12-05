/**
 * Campaign Detail Page - App Router
 * View and edit a specific campaign
 */

import { Metadata } from 'next';
import CampaignDetail from './CampaignDetail';

export const metadata: Metadata = {
  title: 'Campaign Details',
  description: 'View and manage campaign content, schedule, and metrics.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <CampaignDetail campaignId={resolvedParams.id} />;
}
