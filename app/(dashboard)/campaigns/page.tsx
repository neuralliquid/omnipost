/**
 * Campaigns Page - App Router
 * Manages multi-platform content campaigns
 */

import { Metadata } from 'next';
import CampaignList from './CampaignList';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Create and manage multi-platform content distribution campaigns.',
};

export default function CampaignsPage() {
  return <CampaignList />;
}
