'use client';

import React from 'react';
import styles from '@/styles/PageSkeleton.module.css';

interface PageSkeletonProps {
  readonly rows?: number;
  readonly showHeader?: boolean;
}

/**
 * PageSkeleton Component
 * A reusable skeleton loader with animated pulse effect.
 * Respects prefers-reduced-motion for accessibility.
 *
 * Usage:
 * ```tsx
 * <PageSkeleton rows={5} showHeader />
 * ```
 */
function PageSkeleton({ rows = 3, showHeader = false }: PageSkeletonProps) {
  return (
    <div className={styles.container} role="status" aria-label="Loading content">
      {showHeader && (
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.headerTitle}`} />
          <div className={`${styles.skeleton} ${styles.headerSubtitle}`} />
        </div>
      )}
      <div className={styles.rows}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={styles.row}>
            <div
              className={`${styles.skeleton} ${styles.rowLine}`}
              style={{ width: `${75 - (i % 3) * 15}%` }}
            />
          </div>
        ))}
      </div>
      <span className={styles.srOnly}>Loading content, please wait...</span>
    </div>
  );
}

export { PageSkeleton };
export default PageSkeleton;
