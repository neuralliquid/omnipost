/**
 * Campaign Status Badge Component
 * Re-exports the shared StatusBadge for backward compatibility
 */

import React from 'react';
import { CampaignStatus as CampaignStatusType } from '@/types/campaign';
import { StatusBadge } from '@/components/ui';

interface CampaignStatusProps {
  status: CampaignStatusType;
  size?: 'small' | 'medium' | 'large';
}

// Map size prop to StatusBadge size (StatusBadge only supports sm | md)
const sizeMap: Record<string, 'sm' | 'md'> = {
  small: 'sm',
  medium: 'md',
  large: 'md', // large maps to md since StatusBadge doesn't support lg
};

/**
 * CampaignStatusBadge - Wrapper around shared StatusBadge for campaign-specific use
 * Maintained for backward compatibility with existing code
 */
export const CampaignStatusBadge: React.FC<CampaignStatusProps> = ({ status, size = 'medium' }) => {
  return <StatusBadge status={status} size={sizeMap[size]} />;
};

export default CampaignStatusBadge;
