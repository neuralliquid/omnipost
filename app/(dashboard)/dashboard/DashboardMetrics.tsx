'use client';

/**
 * Dashboard Metrics Client Component
 * Handles client-side refresh functionality
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dashboardStyles from '@/styles/dashboard.module.css';

interface EngagementMetric {
  platform: string;
  value: number | string;
}

interface DashboardMetricsProps {
  initialMetrics: EngagementMetric[];
}

/**
 * Renders the metrics content based on state
 */
function MetricsContent({
  error,
  metrics,
  isPending,
  onRefresh,
}: Readonly<{
  error: string | null;
  metrics: EngagementMetric[];
  isPending: boolean;
  onRefresh: () => void;
}>) {
  if (error) {
    return (
      <div className={dashboardStyles.errorMessage}>
        <p>Error loading metrics: {error}</p>
        <button onClick={onRefresh} disabled={isPending} className={dashboardStyles.refreshButton}>
          {isPending ? 'Refreshing...' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (metrics.length === 0) {
    return <p className={dashboardStyles.emptyMessage}>No metrics available</p>;
  }

  return (
    <div className={dashboardStyles.tableContainer}>
      <table className={dashboardStyles.metricsTable}>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric.platform}>
              <td>{metric.platform}</td>
              <td>{metric.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onRefresh} disabled={isPending} className={dashboardStyles.refreshButton}>
        {isPending ? 'Refreshing...' : 'Refresh Data'}
      </button>
    </div>
  );
}

export function DashboardMetrics({ initialMetrics }: Readonly<DashboardMetricsProps>) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = async () => {
    setError(null);

    try {
      const response = await fetch('/api/engagement-metrics');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);

      // Also revalidate the page data
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    }
  };

  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardHeader}>
        <span className={dashboardStyles.cardKicker}>Analytics</span>
        <h2>Engagement Metrics</h2>
        <p>Current engagement by platform with manual refresh support.</p>
      </div>
      <div className={dashboardStyles.cardContent}>
        <MetricsContent
          error={error}
          metrics={metrics}
          isPending={isPending}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
