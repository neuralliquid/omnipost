/**
 * Performance Dashboard Page (App Router)
 * Server Component with server-side data fetching
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { engagementMetrics } from '@/data/engagementMetrics';
import styles from '@/styles/shared.module.css';
import dashboardStyles from '@/styles/dashboard.module.css';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
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

function getNumericMetricValue(value: number | string): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function PerformanceDashboardPage() {
  const metrics = await getEngagementMetrics();
  const metricValues = metrics.map(metric => getNumericMetricValue(metric.value));
  const totalEngagement = metricValues.reduce((total, value) => total + value, 0);
  const topMetric = metrics.reduce<(typeof metrics)[number] | null>((top, metric) => {
    if (!top) return metric;
    return getNumericMetricValue(metric.value) > getNumericMetricValue(top.value) ? metric : top;
  }, null);

  return (
    <>
      <div className={dashboardStyles.dashboardHero}>
        <div>
          <p className={dashboardStyles.eyebrow}>Publishing intelligence</p>
          <h1>Performance Dashboard</h1>
          <p>Monitor engagement, integrations, and platform momentum from one workspace.</p>
        </div>
        <div className={dashboardStyles.heroMeta}>
          <span>{metrics.length} platforms tracked</span>
          <span>{topMetric ? `${topMetric.platform} leads` : 'No leader yet'}</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryGrid} aria-label="Dashboard summary">
        <div className={dashboardStyles.summaryCard}>
          <span className={dashboardStyles.summaryLabel}>Total engagement</span>
          <strong>{totalEngagement.toLocaleString()}</strong>
          <span className={dashboardStyles.summaryHint}>Across tracked platforms</span>
        </div>
        <div className={dashboardStyles.summaryCard}>
          <span className={dashboardStyles.summaryLabel}>Top platform</span>
          <strong>{topMetric?.platform ?? 'None'}</strong>
          <span className={dashboardStyles.summaryHint}>
            {topMetric ? `${topMetric.value} engagement` : 'Waiting for activity'}
          </span>
        </div>
        <div className={dashboardStyles.summaryCard}>
          <span className={dashboardStyles.summaryLabel}>Airtable sync</span>
          <strong>Header controlled</strong>
          <span className={dashboardStyles.summaryHint}>
            Toggle visibility without leaving the page
          </span>
        </div>
      </div>

      <div className={`${styles.section} ${dashboardStyles.dashboardSection}`}>
        <div className={dashboardStyles.dashboardGrid}>
          {/* Engagement Metrics - Server rendered with client refresh */}
          <Suspense
            fallback={
              <div className={dashboardStyles.metricsCard}>
                <div className={dashboardStyles.cardHeader}>
                  <h2>Engagement Metrics</h2>
                </div>
                <div className={dashboardStyles.cardContent}>
                  <PageSkeleton rows={3} />
                </div>
              </div>
            }
          >
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

// Loading skeleton for Airtable
function AirtableSkeleton() {
  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardHeader}>
        <h2>Airtable Integration</h2>
      </div>
      <div className={dashboardStyles.cardContent}>
        <PageSkeleton rows={2} />
      </div>
    </div>
  );
}
