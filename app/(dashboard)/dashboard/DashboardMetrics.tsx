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

export function DashboardMetrics({ initialMetrics }: DashboardMetricsProps) {
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
        <h2>Engagement Metrics</h2>
      </div>
      <div className={dashboardStyles.cardContent}>
        {error ? (
          <div className={dashboardStyles.errorMessage}>
            <p>Error loading metrics: {error}</p>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className={dashboardStyles.refreshButton}
            >
              {isPending ? 'Refreshing...' : 'Try Again'}
            </button>
          </div>
        ) : metrics.length === 0 ? (
          <p>No metrics available</p>
        ) : (
          <div className={dashboardStyles.tableContainer}>
            <table className={dashboardStyles.metricsTable}>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.platform}>
                    <td>{metric.platform}</td>
                    <td>{metric.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className={dashboardStyles.refreshButton}
            >
              {isPending ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
