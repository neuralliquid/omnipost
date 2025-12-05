'use client';

/**
 * Series Content Client Component
 * Handles interactive series management with form and CRUD operations
 */

import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import SeriesForm from '@/components/series/SeriesForm';
import SeriesCard from '@/components/series/SeriesCard';
import EmptyState from '@/components/series/EmptyState';
import { useSeries } from '@/hooks/useSeries';
import { Series } from '@/types/series';
import styles from '@/styles/Series.module.css';

export default function SeriesContent() {
  const { series, isLoading, error, addSeries, editSeries, deleteSeries } = useSeries();
  const [showForm, setShowForm] = useState<boolean>(false);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  return (
    <Layout
      title="Manage Content Series"
      description="Create and manage your technical content series"
    >
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Manage Content Series</h1>
        <p className={styles.pageDescription}>
          Organize your technical content into structured series for better planning and
          distribution
        </p>

        {error ? <div className={styles.errorMessage}>{error}</div> : null}

        {!showForm && series.length > 0 ? (
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button onClick={toggleForm} className={styles.primaryButton}>
              Create New Series
            </button>
          </div>
        ) : null}

        {showForm ? (
          <>
            <SeriesForm
              onAddSeries={(newSeries: { title: string; description: string }) => {
                addSeries(newSeries as Series);
                setShowForm(false);
              }}
            />
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <button onClick={toggleForm} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </>
        ) : null}

        {isLoading ? (
          <div className={styles.loadingState}>Loading your content series...</div>
        ) : series.length === 0 ? (
          <EmptyState onCreateClick={() => setShowForm(true)} />
        ) : (
          <div className={styles.seriesGrid}>
            {series.map((s: Series, index: number) => (
              <SeriesCard
                key={s.id || String(index)}
                series={s}
                index={index}
                onEdit={editSeries}
                onDelete={deleteSeries}
              />
            ))}
          </div>
        )}

        <div className={styles.navigationLinks}>
          <Link href="/workflow" className={styles.navLink}>
            ← View Content Workflow
          </Link>
          <Link href="/dashboard" className={styles.navLink}>
            View Performance Dashboard →
          </Link>
        </div>
      </div>
    </Layout>
  );
}
