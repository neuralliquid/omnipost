/**
 * Campaign List Client Component
 * Handles interactive campaign management with CRUD operations
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { CampaignCard, CampaignForm, EmptyState } from '@/components/campaigns';
import { useCampaign } from '@/hooks/useCampaign';
import { CampaignStatus, CreateCampaignInput } from '@/types/campaign';
import styles from '@/styles/Campaign.module.css';

const STATUS_FILTERS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
];

export default function CampaignList() {
  const { campaigns, isLoading, error, createCampaign, deleteCampaign, duplicateCampaign } =
    useCampaign();

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const handleCreateCampaign = (data: CreateCampaignInput) => {
    createCampaign(data);
    setShowForm(false);
  };

  const filteredCampaigns =
    statusFilter === 'all' ? campaigns : campaigns.filter(c => c.status === statusFilter);

  return (
    <Layout
      title="Campaign Management"
      description="Create and manage multi-platform content campaigns"
    >
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Campaigns</h1>
        <p className={styles.pageDescription}>
          Create and manage multi-platform content distribution campaigns. Link your content series,
          schedule posts, and track engagement across all platforms.
        </p>

        {error ? <div className={styles.errorMessage}>{error}</div> : null}

        {!showForm && campaigns.length > 0 ? (
          <div className={styles.headerActions}>
            <div className={styles.filterGroup}>
              {STATUS_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`${styles.filterButton} ${
                    statusFilter === filter.value ? styles.active : ''
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowForm(true)} className={styles.primaryButton}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Campaign
            </button>
          </div>
        ) : null}

        {showForm ? (
          <CampaignForm onSubmit={handleCreateCampaign} onCancel={() => setShowForm(false)} />
        ) : null}

        {isLoading ? (
          <div className={styles.loadingState}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <EmptyState onCreateClick={() => setShowForm(true)} />
        ) : filteredCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No campaigns match the selected filter.</p>
            <button onClick={() => setStatusFilter('all')} className={styles.secondaryButton}>
              Clear Filter
            </button>
          </div>
        ) : (
          <div className={styles.campaignGrid}>
            {filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={deleteCampaign}
                onDuplicate={duplicateCampaign}
              />
            ))}
          </div>
        )}

        <div className={styles.navigationLinks}>
          <Link href="/series" className={styles.navLink}>
            ← Manage Content Series
          </Link>
          <Link href="/dashboard" className={styles.navLink}>
            View Dashboard →
          </Link>
        </div>
      </div>
    </Layout>
  );
}
