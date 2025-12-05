/**
 * Campaign Empty State Component
 * Shown when no campaigns exist
 */

import React from 'react';
import styles from '@/styles/Campaign.module.css';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className={styles.emptyState}>
      <svg
        className={styles.emptyIcon}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
        />
      </svg>
      <h3 className={styles.emptyTitle}>No Campaigns Yet</h3>
      <p className={styles.emptyDescription}>
        Create your first campaign to start distributing content across multiple platforms.
        Link your existing content series or create standalone posts.
      </p>
      <button onClick={onCreateClick} className={styles.primaryButton}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Your First Campaign
      </button>
    </div>
  );
};

export default EmptyState;
