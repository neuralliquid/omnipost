/**
 * Sequence List Component
 * Displays a list of outreach sequences with filtering
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Sequence } from '@/types/sequence';
import { SequenceCard } from './SequenceCard';
import styles from '@/styles/Sequences.module.css';

interface SequenceListProps {
  onCreateNew?: () => void;
  onEdit?: (sequence: Sequence) => void;
  onView?: (sequence: Sequence) => void;
}

type SequenceStatus = 'all' | 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export const SequenceList: React.FC<SequenceListProps> = ({ onCreateNew, onEdit, onView }) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SequenceStatus>('all');

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/sequences?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sequences');
      }

      const data = await response.json();
      setSequences(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleToggleStatus = async (sequence: Sequence) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch(`/api/sequences/${sequence.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sequence status');
      }

      // Refresh the list
      fetchSequences();
    } catch (err) {
      console.error('Error updating sequence:', err);
    }
  };

  const handleDuplicate = async (sequence: Sequence) => {
    try {
      const duplicateData = {
        name: `${sequence.name} (Copy)`,
        description: sequence.description,
        steps: sequence.steps.map(step => ({
          type: step.type,
          order: step.order,
          name: step.name,
          enabled: step.enabled,
          emailConfig: step.emailConfig,
          linkedinConfig: step.linkedinConfig,
          waitConfig: step.waitConfig,
          taskConfig: step.taskConfig,
          callConfig: step.callConfig,
          conditionConfig: step.conditionConfig,
        })),
        schedule: sequence.schedule,
        stopOnReply: sequence.stopOnReply,
        stopOnBounce: sequence.stopOnBounce,
      };

      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate sequence');
      }

      // Refresh the list
      fetchSequences();
    } catch (err) {
      console.error('Error duplicating sequence:', err);
    }
  };

  const handleDelete = async (sequence: Sequence) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${sequence.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sequences/${sequence.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sequence');
      }

      // Refresh the list
      fetchSequences();
    } catch (err) {
      console.error('Error deleting sequence:', err);
    }
  };

  const getStats = () => {
    const stats = {
      total: sequences.length,
      active: sequences.filter(s => s.status === 'active').length,
      totalEnrolled: sequences.reduce((sum, s) => sum + s.metrics.totalEnrolled, 0),
      totalReplies: sequences.reduce((sum, s) => sum + s.metrics.repliedLeads, 0),
    };
    return stats;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Loading sequences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>Error: {error}</p>
        <button type="button" onClick={fetchSequences} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sequenceListContainer}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Outreach Sequences</h2>
        {onCreateNew && (
          <button type="button" onClick={onCreateNew} className={styles.createButton}>
            + New Sequence
          </button>
        )}
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.active}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalEnrolled}</span>
          <span className={styles.statLabel}>Total Enrolled</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalReplies}</span>
          <span className={styles.statLabel}>Total Replies</span>
        </div>
      </div>

      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder="Search sequences..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as SequenceStatus)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {sequences.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No sequences found</h3>
          <p className={styles.emptyDescription}>
            {statusFilter !== 'all' || searchQuery
              ? 'Try adjusting your filters'
              : 'Create your first outreach sequence to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && onCreateNew && (
            <button type="button" onClick={onCreateNew} className={styles.createButton}>
              Create Sequence
            </button>
          )}
        </div>
      ) : (
        <div className={styles.sequenceGrid}>
          {sequences.map(sequence => (
            <SequenceCard
              key={sequence.id}
              sequence={sequence}
              onEdit={onEdit}
              onView={onView}
              onToggleStatus={handleToggleStatus}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SequenceList;
