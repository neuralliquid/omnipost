/**
 * Campaign Status Badge Component
 * Displays the current status of a campaign with appropriate styling
 */

import React from 'react';
import { CampaignStatus as CampaignStatusType } from '@/types/campaign';
import styles from '@/styles/Campaign.module.css';

interface CampaignStatusProps {
  status: CampaignStatusType;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig: Record<CampaignStatusType, { label: string; className: string }> = {
  draft: { label: 'Draft', className: styles.statusDraft },
  scheduled: { label: 'Scheduled', className: styles.statusScheduled },
  active: { label: 'Active', className: styles.statusActive },
  paused: { label: 'Paused', className: styles.statusPaused },
  completed: { label: 'Completed', className: styles.statusCompleted },
};

export const CampaignStatusBadge: React.FC<CampaignStatusProps> = ({
  status,
  size = 'medium'
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={`${styles.statusBadge} ${config.className}`}
      style={size === 'small' ? { fontSize: '0.625rem', padding: '0.125rem 0.5rem' } : undefined}
    >
      {config.label}
    </span>
  );
};

export default CampaignStatusBadge;
