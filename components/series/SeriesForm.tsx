'use client';

import React, { useState, useCallback } from 'react';
import { Button, FormField } from '@/components/ui';
import { platforms } from '@/lib/config/platforms';
import { PlatformAdaptation, defaultPlatformAdaptation } from '@/types/series';
import styles from '@/styles/Series.module.css';

interface SeriesFormData {
  title: string;
  description: string;
  topics?: string[];
  targetAudience?: string;
  estimatedArticles?: number;
  publishFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  platformAdaptations?: PlatformAdaptation[];
}

interface SeriesFormProps {
  onAddSeries: (series: SeriesFormData) => void;
  initialData?: Partial<SeriesFormData>;
  isEditing?: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
}

const SeriesForm: React.FC<SeriesFormProps> = ({ onAddSeries, initialData, isEditing = false }) => {
  // Initialize platform adaptations with defaults for all platforms
  const getInitialAdaptations = (): PlatformAdaptation[] => {
    if (initialData?.platformAdaptations) {
      // Merge with any new platforms that might have been added
      const existingIds = new Set(initialData.platformAdaptations.map(a => a.platformId));
      const newAdaptations = platforms
        .filter(p => !existingIds.has(p.slug))
        .map(p => ({ ...defaultPlatformAdaptation, platformId: p.slug, enabled: false }));
      return [...initialData.platformAdaptations, ...newAdaptations];
    }
    return platforms.map(p => ({
      ...defaultPlatformAdaptation,
      platformId: p.slug,
      enabled: false,
    }));
  };

  const [formData, setFormData] = useState<SeriesFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    topics: initialData?.topics || [],
    targetAudience: initialData?.targetAudience || '',
    estimatedArticles: initialData?.estimatedArticles,
    publishFrequency: initialData?.publishFrequency,
    platformAdaptations: getInitialAdaptations(),
  });
  const [topicInput, setTopicInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (name === 'title' && errors.title) setErrors(prev => ({ ...prev, title: undefined }));
    if (name === 'description' && errors.description)
      setErrors(prev => ({ ...prev, description: undefined }));
  };

  const handleAddTopic = () => {
    const topic = topicInput.trim();
    if (topic && !formData.topics?.includes(topic)) {
      setFormData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), topic],
      }));
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics?.filter(topic => topic !== topicToRemove),
    }));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platformAdaptations: prev.platformAdaptations?.map(adaptation =>
        adaptation.platformId === platformId
          ? { ...adaptation, enabled: !adaptation.enabled }
          : adaptation
      ),
    }));
  };

  const updatePlatformAdaptation = (
    platformId: string,
    field: keyof PlatformAdaptation,
    value: PlatformAdaptation[keyof PlatformAdaptation]
  ) => {
    setFormData(prev => ({
      ...prev,
      platformAdaptations: prev.platformAdaptations?.map(adaptation =>
        adaptation.platformId === platformId ? { ...adaptation, [field]: value } : adaptation
      ),
    }));
  };

  const toggleExpandPlatform = (platformId: string) => {
    setExpandedPlatform(prev => (prev === platformId ? null : platformId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddSeries(formData);

      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          topics: [],
          targetAudience: '',
          estimatedArticles: undefined,
          publishFrequency: undefined,
          platformAdaptations: getInitialAdaptations(),
        });
        setExpandedPlatform(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledPlatformsCount = formData.platformAdaptations?.filter(a => a.enabled).length || 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <FormField
        label="Series Title"
        name="title"
        type="text"
        value={formData.title}
        onChange={handleInputChange}
        error={errors.title}
        required
        placeholder="e.g., Introduction to TypeScript"
        hint="A clear, descriptive title for your series"
        disabled={isSubmitting}
      />

      <FormField
        as="textarea"
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        error={errors.description}
        required
        placeholder="Describe what this series covers and who it's for..."
        hint="Help readers understand what they'll learn"
        rows={4}
        disabled={isSubmitting}
      />

      <div className={styles.formRow}>
        <FormField
          label="Target Audience"
          name="targetAudience"
          type="text"
          value={formData.targetAudience}
          onChange={handleInputChange}
          placeholder="e.g., Beginner developers"
          optional
          disabled={isSubmitting}
        />

        <FormField
          as="select"
          label="Publish Frequency"
          name="publishFrequency"
          value={formData.publishFrequency || ''}
          onChange={handleInputChange}
          optional
          disabled={isSubmitting}
        >
          <option value="">Select frequency...</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </FormField>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="topics-input" className={styles.formLabel}>
          Topics <span className={styles.optional}>(optional)</span>
        </label>
        <div className={styles.topicInputGroup}>
          <input
            id="topics-input"
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            placeholder="Add a topic and press Enter"
            className={styles.formInput}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAddTopic}
            disabled={!topicInput.trim() || isSubmitting}
          >
            Add
          </Button>
        </div>
        {formData.topics && formData.topics.length > 0 && (
          <div className={styles.topicsList}>
            {formData.topics.map(topic => (
              <span key={topic} className={styles.topicTag}>
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className={styles.removeTopicButton}
                  aria-label={`Remove ${topic}`}
                  disabled={isSubmitting}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Platform Adaptations Section */}
      <div className={styles.platformSection}>
        <div className={styles.platformHeader}>
          <h3 className={styles.platformTitle}>
            Platform Adaptations
            {enabledPlatformsCount > 0 && (
              <span className={styles.platformCount}>{enabledPlatformsCount} selected</span>
            )}
          </h3>
          <p className={styles.platformHint}>
            Select platforms and customize how content is adapted for each
          </p>
        </div>

        <div className={styles.platformList}>
          {formData.platformAdaptations?.map(adaptation => {
            const platform = platforms.find(p => p.slug === adaptation.platformId);
            const isExpanded = expandedPlatform === adaptation.platformId;

            return (
              <div
                key={adaptation.platformId}
                className={`${styles.platformItem} ${adaptation.enabled ? styles.platformEnabled : ''}`}
              >
                <div className={styles.platformItemHeader}>
                  <label className={styles.platformCheckbox}>
                    <input
                      type="checkbox"
                      checked={adaptation.enabled}
                      onChange={() => togglePlatform(adaptation.platformId)}
                      disabled={isSubmitting}
                    />
                    <span className={styles.platformName}>{platform?.name}</span>
                  </label>

                  {adaptation.enabled && (
                    <button
                      type="button"
                      className={styles.platformExpandButton}
                      onClick={() => toggleExpandPlatform(adaptation.platformId)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${platform?.name} settings`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={isExpanded ? styles.expandedIcon : ''}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>

                {adaptation.enabled && isExpanded && (
                  <div className={styles.platformSettings}>
                    <div className={styles.platformSettingsGrid}>
                      <FormField
                        as="select"
                        label="Tone"
                        name={`tone-${adaptation.platformId}`}
                        value={adaptation.tone || 'professional'}
                        onChange={e =>
                          updatePlatformAdaptation(
                            adaptation.platformId,
                            'tone',
                            e.target.value as PlatformAdaptation['tone']
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                        <option value="conversational">Conversational</option>
                      </FormField>

                      <FormField
                        as="select"
                        label="Format"
                        name={`format-${adaptation.platformId}`}
                        value={adaptation.format || 'medium'}
                        onChange={e =>
                          updatePlatformAdaptation(
                            adaptation.platformId,
                            'format',
                            e.target.value as PlatformAdaptation['format']
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long-form</option>
                        <option value="thread">Thread</option>
                      </FormField>

                      <FormField
                        as="select"
                        label="Media"
                        name={`media-${adaptation.platformId}`}
                        value={adaptation.mediaPreference || 'with-image'}
                        onChange={e =>
                          updatePlatformAdaptation(
                            adaptation.platformId,
                            'mediaPreference',
                            e.target.value as PlatformAdaptation['mediaPreference']
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <option value="text-only">Text only</option>
                        <option value="with-image">With image</option>
                        <option value="with-video">With video</option>
                        <option value="carousel">Carousel</option>
                      </FormField>
                    </div>

                    <div className={styles.platformToggles}>
                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={adaptation.includeHashtags ?? true}
                          onChange={e =>
                            updatePlatformAdaptation(
                              adaptation.platformId,
                              'includeHashtags',
                              e.target.checked
                            )
                          }
                          disabled={isSubmitting}
                        />
                        <span>Include hashtags</span>
                      </label>

                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={adaptation.includeCTA ?? true}
                          onChange={e =>
                            updatePlatformAdaptation(
                              adaptation.platformId,
                              'includeCTA',
                              e.target.checked
                            )
                          }
                          disabled={isSubmitting}
                        />
                        <span>Include call-to-action</span>
                      </label>
                    </div>

                    {adaptation.includeCTA && (
                      <FormField
                        label="CTA Text"
                        name={`cta-${adaptation.platformId}`}
                        type="text"
                        value={adaptation.ctaText || ''}
                        onChange={e =>
                          updatePlatformAdaptation(adaptation.platformId, 'ctaText', e.target.value)
                        }
                        placeholder="e.g., Learn more at..."
                        optional
                        disabled={isSubmitting}
                      />
                    )}

                    <FormField
                      as="textarea"
                      label="Platform Notes"
                      name={`notes-${adaptation.platformId}`}
                      value={adaptation.notes || ''}
                      onChange={e =>
                        updatePlatformAdaptation(adaptation.platformId, 'notes', e.target.value)
                      }
                      placeholder="Any specific notes for this platform..."
                      optional
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.formActions}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          loadingText={isEditing ? 'Saving...' : 'Creating...'}
          leftIcon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isEditing ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </>
              )}
            </svg>
          }
        >
          {isEditing ? 'Save Changes' : 'Create Series'}
        </Button>
      </div>
    </form>
  );
};

export default SeriesForm;
