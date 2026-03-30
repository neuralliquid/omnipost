/**
 * Content List Page
 * Displays created content with status badges and navigation to create/edit.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';
import styles from '@/styles/ContentList.module.css';

// ── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'omnipost_content_drafts';

// ── Types ───────────────────────────────────────────────────────────────────

type ContentStatus = 'pending' | 'scheduled' | 'queued' | 'published' | 'failed';

interface StoredPlatform {
  slug: string;
  name: string;
  enabled: boolean;
  hashtags: string;
}

interface StoredContent {
  id: string;
  title: string;
  body: string;
  summary: string;
  platforms: StoredPlatform[];
  status: ContentStatus;
  scheduledTime: string;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadDrafts(): StoredContent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredContent[]) : [];
  } catch {
    return [];
  }
}

function getDisplayStatus(status: ContentStatus): 'Draft' | 'Scheduled' | 'Published' {
  switch (status) {
    case 'published':
      return 'Published';
    case 'scheduled':
    case 'queued':
      return 'Scheduled';
    default:
      return 'Draft';
  }
}

function getBadgeClass(status: ContentStatus): string {
  const display = getDisplayStatus(status);
  switch (display) {
    case 'Published':
      return styles.badgePublished;
    case 'Scheduled':
      return styles.badgeScheduled;
    default:
      return styles.badgeDraft;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function ContentListPage() {
  const [items, setItems] = useState<StoredContent[]>([]);
  const { track, events } = useAnalytics();

  useEffect(() => {
    setItems(loadDrafts());
  }, []);

  const handleItemClick = useCallback(
    (item: StoredContent) => {
      track(events.FEATURE_USED, { featureName: 'content_view', context: item.id });
    },
    [track, events]
  );

  // ── Empty state ─────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Content</h1>
        </div>

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            &#9998;
          </div>
          <h2 className={styles.emptyTitle}>No content yet</h2>
          <p className={styles.emptyDescription}>
            Create your first piece of content and publish it across multiple platforms in minutes.
          </p>
          <Link href="/content/new" className={styles.createButton}>
            + Create New Content
          </Link>
        </div>
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Content</h1>
        <Link href="/content/new" className={styles.createButton}>
          + Create New
        </Link>
      </div>

      <div className={styles.contentList}>
        {items.map(item => {
          const enabledPlatforms = item.platforms.filter(p => p.enabled);
          return (
            <Link
              key={item.id}
              href="/content/new"
              className={styles.contentItem}
              onClick={() => handleItemClick(item)}
            >
              <div className={styles.contentItemInfo}>
                <h3 className={styles.contentItemTitle}>{item.title || 'Untitled'}</h3>
                <div className={styles.contentItemMeta}>
                  <span>{formatDate(item.createdAt)}</span>
                  {item.body && (
                    <span>{item.body.length} chars</span>
                  )}
                </div>
              </div>
              <div className={styles.contentItemRight}>
                {enabledPlatforms.length > 0 && (
                  <span className={styles.platformCount}>
                    {enabledPlatforms.length} platform{enabledPlatforms.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className={getBadgeClass(item.status)}>
                  {getDisplayStatus(item.status)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default ContentListPage;
