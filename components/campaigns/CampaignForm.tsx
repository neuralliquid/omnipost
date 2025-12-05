/**
 * Campaign Form Component
 * Create or edit a campaign with platform and series selection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CreateCampaignInput, Campaign } from '@/types/campaign';
import { platforms as availablePlatforms } from '@/lib/config/platforms';
import { useSeries } from '@/hooks/useSeries';
import styles from '@/styles/Campaign.module.css';

// Platform brand colors
const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1da1f2',
  linkedin: '#0077b5',
  facebook: '#1877f2',
  instagram: '#e4405f',
  'custom-channel': '#6b7280',
};

interface CampaignFormProps {
  initialData?: Campaign;
  onSubmit: (data: CreateCampaignInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { series } = useSeries();
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    seriesIds: initialData?.seriesIds || [],
    platforms: initialData?.platforms.filter(p => p.enabled).map(p => p.platformId) || [],
    tags: initialData?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (formData.platforms?.length === 0) {
      newErrors.platforms = 'Select at least one platform';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms?.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...(prev.platforms || []), platformId],
    }));
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  const toggleSeries = (seriesId: string) => {
    setFormData(prev => ({
      ...prev,
      seriesIds: prev.seriesIds?.includes(seriesId)
        ? prev.seriesIds.filter(id => id !== seriesId)
        : [...(prev.seriesIds || []), seriesId],
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags?.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>{initialData ? 'Edit Campaign' : 'Create New Campaign'}</h2>

      <div className={styles.formGrid}>
        {/* Campaign Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel}>
            Campaign Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className={styles.formInput}
            placeholder="e.g., Q1 Product Launch"
          />
          {errors.name ? <span className={styles.errorMessage}>{errors.name}</span> : null}
        </div>

        {/* Tags */}
        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.formLabel}>
            Tags (press Enter to add)
          </label>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className={styles.formInput}
            placeholder="Add tags..."
          />
          {formData.tags && formData.tags.length > 0 ? (
            <div className={styles.tagList} style={{ marginTop: '0.5rem' }}>
              {formData.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={styles.tag}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  {tag} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Description */}
        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label htmlFor="description" className={styles.formLabel}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.formTextarea}
            placeholder="Describe your campaign goals and strategy..."
          />
        </div>

        {/* Platform Selection */}
        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label className={styles.formLabel} htmlFor="platform-selection">
            Target Platforms *
          </label>
          <div id="platform-selection" className={styles.platformSelection} role="group" aria-label="Target platforms">
            {availablePlatforms.map(platform => (
              <label
                key={platform.slug}
                className={`${styles.platformOption} ${
                  formData.platforms?.includes(platform.slug) ? styles.selected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.platforms?.includes(platform.slug) || false}
                  onChange={() => togglePlatform(platform.slug)}
                />
                <span
                  className={styles.platformLogo}
                  style={{
                    backgroundColor: PLATFORM_COLORS[platform.slug] || '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {platform.name.charAt(0)}
                </span>
                <span className={styles.platformName}>{platform.name}</span>
              </label>
            ))}
          </div>
          {errors.platforms ? (
            <span className={styles.errorMessage}>{errors.platforms}</span>
          ) : null}
        </div>

        {/* Series Selection */}
        {series.length > 0 ? (
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel} htmlFor="series-selection">
              Link to Content Series (optional)
            </label>
            <div id="series-selection" className={styles.seriesSelection} role="group" aria-label="Content series">
              {series.map(s => (
                <label
                  key={s.id}
                  className={`${styles.seriesOption} ${
                    formData.seriesIds?.includes(s.id) ? styles.selected : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.seriesIds?.includes(s.id) || false}
                    onChange={() => toggleSeries(s.id)}
                    style={{ display: 'none' }}
                  />
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {s.description.substring(0, 50)}
                        {s.description.length > 50 ? '...' : ''}
                      </div>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.secondaryButton}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button type="submit" className={styles.primaryButton} disabled={isLoading}>
          {isLoading ? 'Saving...' : (initialData ? 'Update Campaign' : 'Create Campaign')}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;
