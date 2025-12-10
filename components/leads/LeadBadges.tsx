/**
 * Lead Badge Components
 * Status, temperature, and score badges for leads
 */

'use client';

import React from 'react';
import type { LeadStatus, LeadTemperature, LeadScore } from '@/types/lead';
import styles from '@/styles/Leads.module.css';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'statusNew' },
  contacted: { label: 'Contacted', className: 'statusContacted' },
  qualified: { label: 'Qualified', className: 'statusQualified' },
  proposal: { label: 'Proposal', className: 'statusProposal' },
  negotiation: { label: 'Negotiation', className: 'statusNegotiation' },
  won: { label: 'Won', className: 'statusWon' },
  lost: { label: 'Lost', className: 'statusLost' },
  nurturing: { label: 'Nurturing', className: 'statusNurturing' },
};

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: '' };

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      {config.label}
    </span>
  );
};

interface LeadTemperatureBadgeProps {
  temperature: LeadTemperature;
}

const TEMPERATURE_CONFIG: Record<LeadTemperature, { label: string; icon: string; className: string }> = {
  cold: { label: 'Cold', icon: '❄️', className: 'tempCold' },
  warm: { label: 'Warm', icon: '🔥', className: 'tempWarm' },
  hot: { label: 'Hot', icon: '🔥🔥', className: 'tempHot' },
};

export const LeadTemperatureBadge: React.FC<LeadTemperatureBadgeProps> = ({ temperature }) => {
  const config = TEMPERATURE_CONFIG[temperature];

  return (
    <span className={`${styles.badge} ${styles[config.className]}`} title={`${config.label} Lead`}>
      {config.icon}
    </span>
  );
};

interface LeadScoreBadgeProps {
  score: LeadScore;
  showBreakdown?: boolean;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ score, showBreakdown }) => {
  const gradeColors: Record<LeadScore['grade'], string> = {
    A: 'gradeA',
    B: 'gradeB',
    C: 'gradeC',
    D: 'gradeD',
    F: 'gradeF',
  };

  return (
    <div className={styles.scoreBadgeContainer}>
      <span className={`${styles.scoreBadge} ${styles[gradeColors[score.grade]]}`}>
        <span className={styles.scoreValue}>{score.total}</span>
        <span className={styles.scoreGrade}>{score.grade}</span>
      </span>
      {showBreakdown && (
        <div className={styles.scoreBreakdown}>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Demographic</span>
            <span className={styles.breakdownValue}>{score.breakdown.demographic}/25</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Behavioral</span>
            <span className={styles.breakdownValue}>{score.breakdown.behavioral}/30</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Engagement</span>
            <span className={styles.breakdownValue}>{score.breakdown.engagement}/25</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Recency</span>
            <span className={styles.breakdownValue}>{score.breakdown.recency}/20</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface TagBadgeProps {
  name: string;
  color?: string;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ name, color, onRemove }) => {
  return (
    <span
      className={styles.tagBadge}
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className={styles.tagRemove}
          aria-label={`Remove tag ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

interface SourceBadgeProps {
  source: string;
}

const SOURCE_ICONS: Record<string, string> = {
  linkedin: '🔗',
  linkedin_sales_navigator: '🔗',
  website: '🌐',
  referral: '👤',
  cold_outreach: '📧',
  content_engagement: '📄',
  survey: '📝',
  form: '📋',
  event: '🎪',
  import: '📥',
  manual: '✏️',
  other: '📌',
};

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  const icon = SOURCE_ICONS[source] || '📌';
  const label = source.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={styles.sourceBadge} title={`Source: ${label}`}>
      {icon} {label}
    </span>
  );
};
