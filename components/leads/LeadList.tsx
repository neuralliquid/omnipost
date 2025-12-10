/**
 * Lead List Component
 * Displays a filterable, sortable list of leads
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { Lead, LeadFilter, LeadStatus, LeadTemperature } from '@/types/lead';
import { LeadCard } from './LeadCard';
import styles from '@/styles/Leads.module.css';

interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onAddToSequence?: (leadId: string) => void;
  onBulkAction?: (leadIds: string[], action: string) => void;
  onFilterChange?: (filter: LeadFilter) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  onPageChange?: (page: number) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'nurturing', label: 'Nurturing' },
];

const TEMPERATURE_OPTIONS: { value: LeadTemperature; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  loading,
  onEdit,
  onDelete,
  onAddToSequence,
  onBulkAction,
  onFilterChange,
  pagination,
  onPageChange,
}) => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<LeadFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = useCallback((leadId: string, selected: boolean) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  }, [leads, selectedLeads.size]);

  const handleFilterChange = useCallback((key: keyof LeadFilter, value: unknown) => {
    const newFilter = { ...filter, [key]: value || undefined };
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  }, [filter, onFilterChange]);

  const handleSearch = useCallback(() => {
    handleFilterChange('search', searchQuery);
  }, [searchQuery, handleFilterChange]);

  const handleBulkAction = useCallback((action: string) => {
    if (onBulkAction && selectedLeads.size > 0) {
      onBulkAction(Array.from(selectedLeads), action);
      setSelectedLeads(new Set());
    }
  }, [onBulkAction, selectedLeads]);

  const clearFilters = useCallback(() => {
    setFilter({});
    setSearchQuery('');
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [onFilterChange]);

  const hasActiveFilters = Object.values(filter).some(v => v !== undefined) || searchQuery;

  return (
    <div className={styles.leadListContainer}>
      {/* Search and Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filter.status as string || ''}
            onChange={e => handleFilterChange('status', e.target.value as LeadStatus)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filter.temperature as string || ''}
            onChange={e => handleFilterChange('temperature', e.target.value as LeadTemperature)}
            className={styles.filterSelect}
          >
            <option value="">All Temperature</option>
            {TEMPERATURE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Score"
            value={filter.scoreMin || ''}
            onChange={e => handleFilterChange('scoreMin', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
            className={styles.filterInput}
            min={0}
            max={100}
          />

          {hasActiveFilters && (
            <button onClick={clearFilters} className={styles.clearFiltersButton}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && onBulkAction && (
        <div className={styles.bulkActionsBar}>
          <span className={styles.selectedCount}>
            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
          </span>
          <div className={styles.bulkActions}>
            <button
              onClick={() => handleBulkAction('addTag')}
              className={styles.bulkActionButton}
            >
              Add Tag
            </button>
            <button
              onClick={() => handleBulkAction('addToSequence')}
              className={styles.bulkActionButton}
            >
              Add to Sequence
            </button>
            <button
              onClick={() => handleBulkAction('updateStatus')}
              className={styles.bulkActionButton}
            >
              Update Status
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className={`${styles.bulkActionButton} ${styles.dangerButton}`}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Lead Cards */}
      <div className={styles.listHeader}>
        <label className={styles.selectAllLabel}>
          <input
            type="checkbox"
            checked={selectedLeads.size === leads.length && leads.length > 0}
            onChange={handleSelectAll}
            className={styles.selectAllCheckbox}
          />
          Select All
        </label>
        <span className={styles.leadCount}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3>No leads found</h3>
          <p>{hasActiveFilters ? 'Try adjusting your filters' : 'Add your first lead to get started'}</p>
        </div>
      ) : (
        <div className={styles.leadGrid}>
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={selectedLeads.has(lead.id)}
              onSelect={handleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddToSequence={onAddToSequence}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize && (
        <div className={styles.pagination}>
          <button
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={styles.paginationButton}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
          </span>
          <button
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadList;
