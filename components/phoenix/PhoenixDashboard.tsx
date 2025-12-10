/**
 * Phoenix Rooivalk Dashboard Component
 * Overview dashboard for Phoenix lead generation across both brands
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type {
  PhoenixLead,
  PhoenixBrand,
  SkySnareLeadData,
  AeroNetLeadData,
} from '@/types/phoenix-rooivalk';
import { SEGMENT_LABELS, isHighValueEnterprise } from '@/types/phoenix-rooivalk';
import styles from '@/styles/PhoenixDashboard.module.css';

interface DashboardMetrics {
  totalLeads: number;
  skysnareLeads: number;
  aeronetLeads: number;
  newThisWeek: number;
  qualifiedLeads: number;
  demosScheduled: number;
  pilotsRequested: number;
  highValuePipeline: number;
  averageScore: number;
  conversionRate: number;
}

interface SegmentBreakdown {
  segment: string;
  count: number;
  qualified: number;
  avgScore: number;
}

interface PhoenixDashboardProps {
  onViewLeads?: (brand?: PhoenixBrand) => void;
  onCreateSequence?: (brand: PhoenixBrand) => void;
  onViewSequences?: () => void;
}

export const PhoenixDashboard: React.FC<PhoenixDashboardProps> = ({
  onViewLeads,
  onCreateSequence,
  onViewSequences,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [skysnareBreakdown, setSkysnareBreakdown] = useState<SegmentBreakdown[]>([]);
  const [aeronetBreakdown, setAeronetBreakdown] = useState<SegmentBreakdown[]>([]);
  const [recentLeads, setRecentLeads] = useState<PhoenixLead[]>([]);
  const [activeBrand, setActiveBrand] = useState<PhoenixBrand | 'all'>('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch leads with Phoenix data
      const params = new URLSearchParams();
      params.append('hasPhoenixData', 'true');
      if (activeBrand !== 'all') {
        params.append('phoenixBrand', activeBrand);
      }

      const response = await fetch(`/api/phoenix/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setSkysnareBreakdown(data.skysnareBreakdown || []);
      setAeronetBreakdown(data.aeronetBreakdown || []);
      setRecentLeads(data.recentLeads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getBrandColor = (brand: PhoenixBrand) => {
    return brand === 'skysnare' ? '#22C55E' : '#3B82F6';
  };

  const getLeadBrandData = (lead: PhoenixLead) => {
    return lead.phoenixData;
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Loading Phoenix Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>Error: {error}</p>
        <button type="button" onClick={fetchDashboardData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Phoenix Rooivalk</h1>
          <p className={styles.subtitle}>Lead Generation Dashboard</p>
        </div>
        <div className={styles.brandToggle}>
          <button
            type="button"
            className={`${styles.brandButton} ${activeBrand === 'all' ? styles.active : ''}`}
            onClick={() => setActiveBrand('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.brandButton} ${styles.skysnare} ${activeBrand === 'skysnare' ? styles.active : ''}`}
            onClick={() => setActiveBrand('skysnare')}
          >
            SkySnare™
          </button>
          <button
            type="button"
            className={`${styles.brandButton} ${styles.aeronet} ${activeBrand === 'aeronet' ? styles.active : ''}`}
            onClick={() => setActiveBrand('aeronet')}
          >
            AeroNet™
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics?.totalLeads || 0}</div>
          <div className={styles.metricLabel}>Total Leads</div>
          <div className={styles.metricSubtext}>
            <span className={styles.skysnareText}>{metrics?.skysnareLeads || 0} SkySnare</span>
            {' · '}
            <span className={styles.aeronetText}>{metrics?.aeronetLeads || 0} AeroNet</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics?.newThisWeek || 0}</div>
          <div className={styles.metricLabel}>New This Week</div>
          <div className={styles.metricTrend}>
            <span className={styles.trendUp}>↑ 12%</span> vs last week
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics?.qualifiedLeads || 0}</div>
          <div className={styles.metricLabel}>Qualified Leads</div>
          <div className={styles.metricSubtext}>
            {metrics?.conversionRate || 0}% conversion rate
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics?.averageScore || 0}</div>
          <div className={styles.metricLabel}>Avg Lead Score</div>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreBarFill}
              style={{ width: `${metrics?.averageScore || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Brand Sections */}
      <div className={styles.brandSections}>
        {/* SkySnare Section */}
        {(activeBrand === 'all' || activeBrand === 'skysnare') && (
          <div className={styles.brandSection}>
            <div className={styles.brandHeader}>
              <div className={styles.brandTitle}>
                <span className={styles.brandIcon} style={{ background: '#22C55E' }}>
                  S
                </span>
                <div>
                  <h2>SkySnare™</h2>
                  <span className={styles.brandTagline}>Consumer Training Equipment</span>
                </div>
              </div>
              <div className={styles.brandActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => onViewLeads?.('skysnare')}
                >
                  View Leads
                </button>
                <button
                  type="button"
                  className={styles.actionButtonPrimary}
                  onClick={() => onCreateSequence?.('skysnare')}
                >
                  + New Sequence
                </button>
              </div>
            </div>

            <div className={styles.brandMetrics}>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>{metrics?.demosScheduled || 0}</span>
                <span className={styles.brandMetricLabel}>Demos Scheduled</span>
              </div>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>
                  {skysnareBreakdown.find(s => s.segment === 'training_facility')?.count || 0}
                </span>
                <span className={styles.brandMetricLabel}>Training Facilities</span>
              </div>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>
                  {skysnareBreakdown.reduce((sum, s) => sum + s.qualified, 0)}
                </span>
                <span className={styles.brandMetricLabel}>Qualified</span>
              </div>
            </div>

            <div className={styles.segmentList}>
              <h4>Segment Breakdown</h4>
              {skysnareBreakdown.map(segment => (
                <div key={segment.segment} className={styles.segmentRow}>
                  <span className={styles.segmentName}>
                    {SEGMENT_LABELS[segment.segment as keyof typeof SEGMENT_LABELS] ||
                      segment.segment}
                  </span>
                  <span className={styles.segmentCount}>{segment.count} leads</span>
                  <span className={styles.segmentScore}>Avg: {segment.avgScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AeroNet Section */}
        {(activeBrand === 'all' || activeBrand === 'aeronet') && (
          <div className={styles.brandSection}>
            <div className={styles.brandHeader}>
              <div className={styles.brandTitle}>
                <span className={styles.brandIcon} style={{ background: '#3B82F6' }}>
                  A
                </span>
                <div>
                  <h2>AeroNet™</h2>
                  <span className={styles.brandTagline}>Enterprise Infrastructure Security</span>
                </div>
              </div>
              <div className={styles.brandActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => onViewLeads?.('aeronet')}
                >
                  View Leads
                </button>
                <button
                  type="button"
                  className={styles.actionButtonPrimary}
                  onClick={() => onCreateSequence?.('aeronet')}
                >
                  + New Sequence
                </button>
              </div>
            </div>

            <div className={styles.brandMetrics}>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>{metrics?.pilotsRequested || 0}</span>
                <span className={styles.brandMetricLabel}>Pilots Requested</span>
              </div>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>{metrics?.highValuePipeline || 0}</span>
                <span className={styles.brandMetricLabel}>High-Value Pipeline</span>
              </div>
              <div className={styles.brandMetric}>
                <span className={styles.brandMetricValue}>
                  {aeronetBreakdown.reduce((sum, s) => sum + s.qualified, 0)}
                </span>
                <span className={styles.brandMetricLabel}>Qualified</span>
              </div>
            </div>

            <div className={styles.segmentList}>
              <h4>Segment Breakdown</h4>
              {aeronetBreakdown.map(segment => (
                <div key={segment.segment} className={styles.segmentRow}>
                  <span className={styles.segmentName}>
                    {SEGMENT_LABELS[segment.segment as keyof typeof SEGMENT_LABELS] ||
                      segment.segment}
                  </span>
                  <span className={styles.segmentCount}>{segment.count} leads</span>
                  <span className={styles.segmentScore}>Avg: {segment.avgScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className={styles.recentLeadsSection}>
        <div className={styles.sectionHeader}>
          <h3>Recent Phoenix Leads</h3>
          <button type="button" className={styles.viewAllButton} onClick={() => onViewLeads?.()}>
            View All →
          </button>
        </div>

        <div className={styles.leadsTable}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Company</span>
            <span>Brand</span>
            <span>Segment</span>
            <span>Score</span>
            <span>Status</span>
          </div>
          {recentLeads.slice(0, 10).map(lead => {
            const brandData = getLeadBrandData(lead);
            return (
              <div key={lead.id} className={styles.tableRow}>
                <span className={styles.leadName}>{lead.fullName}</span>
                <span className={styles.leadCompany}>{lead.company?.name || '-'}</span>
                <span>
                  <span
                    className={styles.brandBadge}
                    style={{ background: getBrandColor(brandData?.brand || 'skysnare') }}
                  >
                    {brandData?.brand === 'skysnare' ? 'SkySnare' : 'AeroNet'}
                  </span>
                </span>
                <span className={styles.leadSegment}>
                  {brandData
                    ? SEGMENT_LABELS[brandData.segment as keyof typeof SEGMENT_LABELS]
                    : '-'}
                </span>
                <span className={styles.leadScore}>
                  <span className={`${styles.scoreGrade} ${styles[`grade${lead.score.grade}`]}`}>
                    {lead.score.grade}
                  </span>
                  {lead.score.total}
                </span>
                <span className={`${styles.statusBadge} ${styles[`status${lead.status}`]}`}>
                  {lead.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button
            type="button"
            className={styles.quickActionButton}
            onClick={() => onViewSequences?.()}
          >
            <span className={styles.quickActionIcon}>📧</span>
            <span>Manage Sequences</span>
          </button>
          <button type="button" className={styles.quickActionButton}>
            <span className={styles.quickActionIcon}>📊</span>
            <span>Export Report</span>
          </button>
          <button type="button" className={styles.quickActionButton}>
            <span className={styles.quickActionIcon}>⚙️</span>
            <span>Scoring Rules</span>
          </button>
          <button type="button" className={styles.quickActionButton}>
            <span className={styles.quickActionIcon}>📝</span>
            <span>Form Builder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoenixDashboard;
