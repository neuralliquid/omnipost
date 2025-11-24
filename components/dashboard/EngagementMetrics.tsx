import React from 'react';
import { EngagementMetric } from '../../hooks/useEngagementMetrics';
import MetricsCard from './MetricsCard';
import dashboardStyles from '../../styles/dashboard.module.css';

interface EngagementMetricsProps {
  metrics: EngagementMetric[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * Component for displaying engagement metrics from different platforms
 */
const EngagementMetrics: React.FC<EngagementMetricsProps> = ({
  metrics,
  isLoading,
  error,
  onRefresh,
}) => {
  return (
    <MetricsCard title="Engagement Metrics" isLoading={isLoading}>
      {error ? (
        <div className={dashboardStyles.errorMessage}>
          <p>Error loading metrics: {error}</p>
          <button onClick={onRefresh} className={dashboardStyles.refreshButton}>
            Try Again
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
              {metrics.map(metric => (
                <tr key={metric.platform}>
                  <td>{metric.platform}</td>
                  <td>{metric.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={onRefresh} className={dashboardStyles.refreshButton}>
            Refresh Data
          </button>
        </div>
      )}
    </MetricsCard>
  );
};

export default EngagementMetrics;
