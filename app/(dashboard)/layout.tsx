/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages with error boundary protection
 */

'use client';

import { ErrorBoundary } from '@/components/ui';
import styles from '@/styles/shared.module.css';

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  );
}
