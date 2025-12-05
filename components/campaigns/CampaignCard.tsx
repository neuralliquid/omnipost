/**
 * Campaign Card Component
 * Displays a campaign summary in a card format
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { CampaignStatusBadge } from './CampaignStatus';
import styles from '@/styles/Campaign.module.css';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
  onDuplicate?: (campaignId: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const enabledPlatforms = campaign.platforms.filter(p => p.enabled);
  const formattedDate = new Date(campaign.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this campaign?')) {
      onDelete(campaign.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(campaign.id);
    }
  };

  return (
    <div className={styles.campaignCard}>
      <div className={styles.campaignHeader}>
        <Link href={`/campaigns/${campaign.id}`} className={styles.campaignTitle}>
          {campaign.name}
        </Link>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      {campaign.description ? (
        <p className={styles.campaignDescription}>{campaign.description}</p>
      ) : null}

      {campaign.tags.length > 0 ? (
        <div className={styles.tagList}>
          {campaign.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.campaignMeta}>
        <span className={styles.metaItem}>
          <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formattedDate}
        </span>
        <span className={styles.metaItem}>
          <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {campaign.contentItems.length} content items
        </span>
        {campaign.seriesIds.length > 0 ? (
          <span className={styles.metaItem}>
            <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {campaign.seriesIds.length} series linked
          </span>
        ) : null}
      </div>

      {enabledPlatforms.length > 0 ? (
        <div className={styles.platformIcons}>
          {enabledPlatforms.map(platform => (
            <span
              key={platform.platformId}
              className={`${styles.platformIcon} ${styles[platform.platformId] || ''} enabled`}
              title={platform.platformName}
            >
              {platform.platformName.charAt(0).toUpperCase()}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.metricsRow}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{campaign.metrics.totalPosts}</span>
          <span className={styles.metricLabel}>Total Posts</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{campaign.metrics.publishedPosts}</span>
          <span className={styles.metricLabel}>Published</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{campaign.metrics.scheduledPosts}</span>
          <span className={styles.metricLabel}>Scheduled</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{campaign.metrics.totalEngagement}</span>
          <span className={styles.metricLabel}>Engagements</span>
        </div>
      </div>

      <div className={styles.campaignActions}>
        <Link href={`/campaigns/${campaign.id}`} className={styles.secondaryButton}>
          View Details
        </Link>
        {onDuplicate ? (
          <button
            onClick={handleDuplicate}
            className={styles.iconButton}
            title="Duplicate campaign"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        ) : null}
        {onDelete ? (
          <button
            onClick={handleDelete}
            className={`${styles.iconButton} ${styles.dangerButton}`}
            title="Delete campaign"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default CampaignCard;
