/**
 * Campaign Detail Client Component
 * Full campaign view with content management, scheduling, and metrics
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { CampaignStatusBadge, CampaignForm } from '@/components/campaigns';
import { useCampaign } from '@/hooks/useCampaign';
import { useSeries } from '@/hooks/useSeries';
import {
  Campaign,
  CampaignContent,
  CampaignContentType,
  UpdateCampaignInput,
} from '@/types/campaign';
import styles from '@/styles/Campaign.module.css';

interface CampaignDetailProps {
  campaignId: string;
}

export default function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const router = useRouter();
  const {
    getCampaign,
    updateCampaign,
    deleteCampaign,
    addContent,
    removeContent,
    togglePlatform,
    updateStatus,
    pauseCampaign,
    resumeCampaign,
  } = useCampaign();

  const { series } = useSeries();
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    body: '',
    type: 'standalone' as CampaignContentType,
  });

  useEffect(() => {
    const found = getCampaign(campaignId);
    setCampaign(found);
  }, [campaignId, getCampaign]);

  if (!campaign) {
    return (
      <Layout title="Campaign Not Found" description="">
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2>Campaign not found</h2>
            <p>The campaign you're looking for doesn't exist or has been deleted.</p>
            <Link href="/campaigns" className={styles.primaryButton}>
              Back to Campaigns
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const linkedSeries = series.filter(s => campaign.seriesIds.includes(s.id));

  const handleUpdateCampaign = (data: UpdateCampaignInput) => {
    const updated = updateCampaign(campaignId, data);
    if (updated) {
      setCampaign(updated);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(campaignId);
      router.push('/campaigns');
    }
  };

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.title && newContent.body) {
      const updated = addContent(campaignId, {
        type: newContent.type,
        title: newContent.title,
        body: newContent.body,
        adaptations: [],
      });
      if (updated) {
        setCampaign(updated);
      }
      setNewContent({ title: '', body: '', type: 'standalone' });
      setShowAddContent(false);
    }
  };

  const handleRemoveContent = (contentId: string) => {
    if (confirm('Remove this content from the campaign?')) {
      const updated = removeContent(campaignId, contentId);
      if (updated) {
        setCampaign(updated);
      }
    }
  };

  const handleTogglePlatform = (platformId: string) => {
    const updated = togglePlatform(campaignId, platformId);
    if (updated) {
      setCampaign(updated);
    }
  };

  const handleStatusAction = () => {
    let updated;
    if (campaign.status === 'paused') {
      updated = resumeCampaign(campaignId);
    } else if (campaign.status === 'active' || campaign.status === 'scheduled') {
      updated = pauseCampaign(campaignId);
    } else if (campaign.status === 'draft') {
      updated = updateStatus(campaignId, 'active');
    }
    if (updated) {
      setCampaign(updated);
    }
  };

  return (
    <Layout title={campaign.name} description={campaign.description}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerActions}>
          <div>
            <Link href="/campaigns" className={styles.navLink}>
              ← Back to Campaigns
            </Link>
            <h1 className={styles.pageTitle} style={{ marginTop: '1rem' }}>
              {campaign.name}
            </h1>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}
            >
              <CampaignStatusBadge status={campaign.status} />
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                Last updated:{' '}
                {new Date(campaign.updatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {campaign.status !== 'completed' ? (
              <button onClick={handleStatusAction} className={styles.secondaryButton}>
                {campaign.status === 'paused'
                  ? 'Resume'
                  : campaign.status === 'draft'
                    ? 'Activate'
                    : 'Pause'}
              </button>
            ) : null}
            <button onClick={() => setIsEditing(true)} className={styles.secondaryButton}>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={`${styles.secondaryButton} ${styles.dangerButton}`}
            >
              Delete
            </button>
          </div>
        </div>

        {campaign.description ? (
          <p className={styles.pageDescription}>{campaign.description}</p>
        ) : null}

        {isEditing ? (
          <CampaignForm
            initialData={campaign}
            onSubmit={data => handleUpdateCampaign(data as UpdateCampaignInput)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {/* Metrics Summary */}
            <div className={styles.campaignCard} style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Campaign Metrics</h3>
              <div className={styles.metricsRow}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{campaign.metrics.totalPosts}</span>
                  <span className={styles.metricLabel}>Total Posts</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{campaign.metrics.publishedPosts}</span>
                  <span className={styles.metricLabel}>Published</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{campaign.metrics.scheduledPosts}</span>
                  <span className={styles.metricLabel}>Scheduled</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{campaign.metrics.failedPosts}</span>
                  <span className={styles.metricLabel}>Failed</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{campaign.metrics.totalEngagement}</span>
                  <span className={styles.metricLabel}>Total Engagement</span>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className={styles.campaignCard} style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Target Platforms</h3>
              <div className={styles.platformSelection}>
                {campaign.platforms.map(platform => (
                  <label
                    key={platform.platformId}
                    className={`${styles.platformOption} ${
                      platform.enabled ? styles.selected : ''
                    }`}
                    onClick={() => handleTogglePlatform(platform.platformId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className={styles.platformLogo}
                      style={{
                        backgroundColor: platform.enabled ? '#4f46e5' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: platform.enabled ? 'white' : '#666',
                        fontWeight: 'bold',
                      }}
                    >
                      {platform.platformName.charAt(0)}
                    </span>
                    <span className={styles.platformName}>{platform.platformName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Linked Series */}
            {linkedSeries.length > 0 ? (
              <div className={styles.campaignCard} style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Linked Content Series</h3>
                <div className={styles.seriesSelection}>
                  {linkedSeries.map(s => (
                    <div key={s.id} className={styles.seriesOption}>
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.title}</div>
                        {s.description ? (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.description}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Content Items */}
            <div className={styles.campaignCard}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3>Campaign Content</h3>
                <button onClick={() => setShowAddContent(true)} className={styles.secondaryButton}>
                  Add Content
                </button>
              </div>

              {showAddContent ? (
                <form
                  onSubmit={handleAddContent}
                  style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                >
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Title</label>
                    <input
                      type="text"
                      value={newContent.title}
                      onChange={e => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Content title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Content Type</label>
                    <select
                      value={newContent.type}
                      onChange={e =>
                        setNewContent(prev => ({
                          ...prev,
                          type: e.target.value as CampaignContentType,
                        }))
                      }
                      className={styles.formSelect}
                    >
                      <option value="standalone">Standalone Post</option>
                      <option value="thread">Thread</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Body</label>
                    <textarea
                      value={newContent.body}
                      onChange={e => setNewContent(prev => ({ ...prev, body: e.target.value }))}
                      className={styles.formTextarea}
                      placeholder="Write your content..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddContent(false)}
                      className={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.primaryButton}>
                      Add Content
                    </button>
                  </div>
                </form>
              ) : null}

              {campaign.contentItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                    background: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <p>No content added yet. Add content to start building your campaign.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {campaign.contentItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0 }}>{item.title}</h4>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#666',
                              textTransform: 'capitalize',
                            }}
                          >
                            {item.type.replace('-', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveContent(item.id)}
                          className={`${styles.iconButton} ${styles.dangerButton}`}
                          title="Remove content"
                        >
                          ×
                        </button>
                      </div>
                      <p
                        style={{
                          marginTop: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#333',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {item.body.length > 200 ? `${item.body.substring(0, 200)}...` : item.body}
                      </p>
                      {item.adaptations.length > 0 ? (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#666',
                          }}
                        >
                          {item.adaptations.length} platform adaptation
                          {item.adaptations.length !== 1 ? 's' : ''}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.navigationLinks}>
          <Link href="/campaigns" className={styles.navLink}>
            ← Back to Campaigns
          </Link>
          <Link href="/series" className={styles.navLink}>
            Manage Series →
          </Link>
        </div>
      </div>
    </Layout>
  );
}
