/**
 * Sequence Card Component
 * Displays a summary of an outreach sequence
 */

'use client';

import React from 'react';
import type { Sequence } from '@/types/sequence';
import styles from '@/styles/Sequences.module.css';

interface SequenceCardProps {
  sequence: Sequence;
  onEdit?: (sequence: Sequence) => void;
  onView?: (sequence: Sequence) => void;
  onToggleStatus?: (sequence: Sequence) => void;
  onDuplicate?: (sequence: Sequence) => void;
  onDelete?: (sequence: Sequence) => void;
}

const STATUS_LABELS: Record<Sequence['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

const STEP_TYPE_ICONS: Record<string, string> = {
  email: '✉️',
  linkedin_connection: '🔗',
  linkedin_message: '💬',
  linkedin_view_profile: '👁️',
  wait: '⏳',
  task: '📋',
  call: '📞',
  condition: '🔀',
};

export const SequenceCard: React.FC<SequenceCardProps> = ({
  sequence,
  onEdit,
  onView,
  onToggleStatus,
  onDuplicate,
  onDelete,
}) => {
  const getStatusClass = () => {
    switch (sequence.status) {
      case 'active':
        return styles.statusActive;
      case 'paused':
        return styles.statusPaused;
      case 'draft':
        return styles.statusDraft;
      case 'completed':
        return styles.statusCompleted;
      case 'archived':
        return styles.statusArchived;
      default:
        return '';
    }
  };

  const getStepsSummary = () => {
    const typeCounts: Record<string, number> = {};
    sequence.steps.forEach(step => {
      typeCounts[step.type] = (typeCounts[step.type] || 0) + 1;
    });
    return typeCounts;
  };

  const stepsSummary = getStepsSummary();
  const { metrics } = sequence;

  const calculateOpenRate = () => {
    if (!metrics.emailStats.sent) return 0;
    return Math.round((metrics.emailStats.opened / metrics.emailStats.sent) * 100);
  };

  const calculateReplyRate = () => {
    if (!metrics.emailStats.sent) return 0;
    return Math.round((metrics.emailStats.replied / metrics.emailStats.sent) * 100);
  };

  return (
    <div className={styles.sequenceCard}>
      <div className={styles.cardHeader}>
        <div className={styles.sequenceInfo}>
          <h3 className={styles.sequenceName}>{sequence.name}</h3>
          {sequence.description && (
            <p className={styles.sequenceDescription}>{sequence.description}</p>
          )}
        </div>
        <span className={`${styles.statusBadge} ${getStatusClass()}`}>
          {STATUS_LABELS[sequence.status]}
        </span>
      </div>

      <div className={styles.stepsPreview}>
        <div className={styles.stepsHeader}>
          <span className={styles.stepsLabel}>
            {sequence.steps.length} step{sequence.steps.length !== 1 ? 's' : ''}
          </span>
          <div className={styles.stepTypes}>
            {Object.entries(stepsSummary).map(([type, count]) => (
              <span key={type} className={styles.stepType} title={type.replace('_', ' ')}>
                {STEP_TYPE_ICONS[type] || '📌'} {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{metrics.totalEnrolled}</span>
          <span className={styles.metricLabel}>Enrolled</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{metrics.activeLeads}</span>
          <span className={styles.metricLabel}>Active</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{metrics.completedLeads}</span>
          <span className={styles.metricLabel}>Completed</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{calculateOpenRate()}%</span>
          <span className={styles.metricLabel}>Open Rate</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{calculateReplyRate()}%</span>
          <span className={styles.metricLabel}>Reply Rate</span>
        </div>
      </div>

      <div className={styles.scheduleInfo}>
        <span className={styles.scheduleLabel}>Schedule:</span>
        <span className={styles.scheduleValue}>
          {sequence.schedule.sendingDays.length === 7
            ? 'Every day'
            : sequence.schedule.sendingDays
                .slice(0, 3)
                .map(d => d.charAt(0).toUpperCase() + d.slice(1, 3))
                .join(', ')}
          {sequence.schedule.sendingDays.length > 3 &&
            sequence.schedule.sendingDays.length < 7 &&
            '...'}{' '}
          {sequence.schedule.sendingHours.start} - {sequence.schedule.sendingHours.end}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.lastUpdated}>
          Updated {new Date(sequence.updatedAt).toLocaleDateString()}
        </span>
        <div className={styles.cardActions}>
          {onView && (
            <button
              type="button"
              onClick={() => onView(sequence)}
              className={`${styles.actionButton} ${styles.viewButton}`}
            >
              View
            </button>
          )}
          {onToggleStatus && sequence.status !== 'completed' && sequence.status !== 'archived' && (
            <button
              type="button"
              onClick={() => onToggleStatus(sequence)}
              className={`${styles.actionButton} ${sequence.status === 'active' ? styles.pauseButton : styles.activateButton}`}
            >
              {sequence.status === 'active' ? 'Pause' : 'Activate'}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(sequence)}
              className={`${styles.actionButton} ${styles.editButton}`}
            >
              Edit
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(sequence)}
              className={`${styles.actionButton} ${styles.duplicateButton}`}
              title="Duplicate"
            >
              📋
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(sequence)}
              className={`${styles.actionButton} ${styles.deleteButton}`}
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequenceCard;
