/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages with error boundary protection
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ErrorBoundary } from '@/components/ui';
import styles from '@/styles/shared.module.css';

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  );
}
