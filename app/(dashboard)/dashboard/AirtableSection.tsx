'use client';

/**
 * Airtable Section Client Component
 * Wraps the Airtable integration for the dashboard
 */

import AirtableIntegration from '@/components/content/AirtableIntegration';
import dashboardStyles from '@/styles/dashboard.module.css';
import { useEffect, useState } from 'react';

const AIRTABLE_STORAGE_KEY = 'omnipost.airtableEnabled';

export function AirtableSection() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AIRTABLE_STORAGE_KEY);
    if (stored !== null) {
      setEnabled(stored === 'true');
    }

    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      setEnabled(customEvent.detail.enabled);
    };

    window.addEventListener('omnipost:airtable-toggle', handleToggle);
    return () => window.removeEventListener('omnipost:airtable-toggle', handleToggle);
  }, []);

  if (!enabled) {
    return (
      <div className={`${dashboardStyles.metricsCard} ${dashboardStyles.integrationPausedCard}`}>
        <div className={dashboardStyles.cardHeader}>
          <span className={dashboardStyles.cardKicker}>Integration</span>
          <h2>Airtable paused</h2>
        </div>
        <div className={dashboardStyles.cardContent}>
          <p>
            Airtable dashboard records are hidden. Use the header Airtable toggle to bring the
            integration panel back.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.metricsCard}>
      <div className={dashboardStyles.cardHeader}>
        <span className={dashboardStyles.cardKicker}>Integration</span>
      </div>
      <div className={dashboardStyles.cardContent}>
        <AirtableIntegration />
      </div>
    </div>
  );
}
