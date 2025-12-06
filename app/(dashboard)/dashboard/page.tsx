/**
 * Performance Dashboard Page (App Router)
 * Server Component with server-side data fetching
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { engagementMetrics } from '@/data/engagementMetrics';
import styles from '@/styles/shared.module.css';
import dashboardStyles from '@/styles/dashboard.module.css';
import { DashboardMetrics } from './DashboardMetrics';
import { AirtableSection } from './AirtableSection';

export const metadata: Metadata = {
  title: 'Performance Dashboard',
  description: 'Monitor and analyze your content performance across platforms',
};

// Server-side data fetching
async function getEngagementMetrics() {
  // In production, this would fetch from an API or database
  // For now, we import directly (simulating server-side data access)
  return engagementMetrics;
}

export default async function PerformanceDashboardPage() {
  const metrics = await getEngagementMetrics();

  return (
    <>
      <div className={styles.header}>
        <h1>Performance Dashboard</h1>
        <p>Monitor and analyze your content performance across platforms</p>
      </div>
      <div className={styles.section}>
        <div className={dashboardStyles.dashboardGrid}>
          {/* Engagement Metrics - Server rendered with client refresh */}
          <Suspense fallback={<MetricsSkeleton />}>
            <DashboardMetrics initialMetrics={metrics} />
          </Suspense>

          {/* Airtable Integration */}
          <Suspense fallback={<AirtableSkeleton />}>
            <AirtableSection />
          </Suspense>
        </div>
      </div>
    </>
  );
}

// Loading skeleton for metrics
function MetricsSkeleton() {
  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardHeader}>
        <h2>Engagement Metrics</h2>
      </div>
      <div className={dashboardStyles.cardContent}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for Airtable
function AirtableSkeleton() {
  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardHeader}>
        <h2>Airtable Integration</h2>
      </div>
      <div className={dashboardStyles.cardContent}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}
