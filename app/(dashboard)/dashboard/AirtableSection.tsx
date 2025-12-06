'use client';

/**
 * Airtable Section Client Component
 * Wraps the Airtable integration for the dashboard
 */

import AirtableIntegration from '@/components/content/AirtableIntegration';
import dashboardStyles from '@/styles/dashboard.module.css';

export function AirtableSection() {
  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardContent}>
        <AirtableIntegration />
      </div>
    </div>
  );
}
