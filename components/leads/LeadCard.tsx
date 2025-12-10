/**
 * Lead Card Component
 * Displays a lead summary in a card format
 */

'use client';

import React from 'react';
import Link from 'next/link';
import type { Lead } from '@/types/lead';
import { LeadStatusBadge, LeadTemperatureBadge, LeadScoreBadge } from './LeadBadges';
import styles from '@/styles/Leads.module.css';

interface LeadCardProps {
  lead: Lead;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onAddToSequence?: (leadId: string) => void;
  selected?: boolean;
  onSelect?: (leadId: string, selected: boolean) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEdit,
  onDelete,
  onAddToSequence,
  selected,
  onSelect,
}) => {
  const formattedDate = new Date(lead.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && globalThis.confirm('Are you sure you want to delete this lead?')) {
      onDelete(lead.id);
    }
  };

  const handleAddToSequence = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToSequence) {
      onAddToSequence(lead.id);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(lead.id, e.target.checked);
    }
  };

  return (
    <div className={`${styles.leadCard} ${selected ? styles.selected : ''}`}>
      <div className={styles.leadHeader}>
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
            className={styles.selectCheckbox}
            aria-label={`Select ${lead.fullName}`}
          />
        )}
        <div className={styles.leadInfo}>
          <Link href={`/leads/${lead.id}`} className={styles.leadName}>
            {lead.fullName}
          </Link>
          {lead.title && <span className={styles.leadTitle}>{lead.title}</span>}
        </div>
        <div className={styles.badgeGroup}>
          <LeadScoreBadge score={lead.score} />
          <LeadTemperatureBadge temperature={lead.temperature} />
        </div>
      </div>

      {lead.company?.name && (
        <div className={styles.companyInfo}>
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span>{lead.company.name}</span>
          {lead.company.industry && (
            <span className={styles.industry}>{lead.company.industry}</span>
          )}
        </div>
      )}

      <div className={styles.contactInfo}>
        {lead.contact.email && (
          <a href={`mailto:${lead.contact.email}`} className={styles.contactItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {lead.contact.email}
          </a>
        )}
        {lead.contact.phone && (
          <a href={`tel:${lead.contact.phone}`} className={styles.contactItem}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {lead.contact.phone}
          </a>
        )}
        {lead.contact.linkedinUrl && (
          <a
            href={lead.contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactItem}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        )}
      </div>

      {lead.tags.length > 0 && (
        <div className={styles.tagList}>
          {lead.tags.slice(0, 5).map(tag => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
          {lead.tags.length > 5 && (
            <span className={styles.moreTag}>+{lead.tags.length - 5}</span>
          )}
        </div>
      )}

      <div className={styles.leadMeta}>
        <LeadStatusBadge status={lead.status} />
        <span className={styles.metaItem}>
          <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Added {formattedDate}
        </span>
        {lead.lastInteractionAt && (
          <span className={styles.metaItem}>
            Last contact:{' '}
            {new Date(lead.lastInteractionAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {lead.activeSequences.length > 0 && (
        <div className={styles.sequenceInfo}>
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>In {lead.activeSequences.length} active sequence(s)</span>
        </div>
      )}

      <div className={styles.leadActions}>
        <Link href={`/leads/${lead.id}`} className={styles.secondaryButton}>
          View Details
        </Link>
        {onAddToSequence && (
          <button
            onClick={handleAddToSequence}
            className={styles.iconButton}
            title="Add to sequence"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(lead)}
            className={styles.iconButton}
            title="Edit lead"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className={`${styles.iconButton} ${styles.dangerButton}`}
            title="Delete lead"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
