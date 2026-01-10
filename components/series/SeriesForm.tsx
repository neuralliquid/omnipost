'use client';

import React, { useState, useCallback } from 'react';
import { Button, FormField } from '@/components/ui';
import styles from '@/styles/Series.module.css';

interface SeriesFormData {
  title: string;
  description: string;
  topics?: string[];
  targetAudience?: string;
  estimatedArticles?: number;
  publishFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
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

const SeriesForm: React.FC<SeriesFormProps> = ({
  onAddSeries,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<SeriesFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    topics: initialData?.topics || [],
    targetAudience: initialData?.targetAudience || '',
    estimatedArticles: initialData?.estimatedArticles,
    publishFrequency: initialData?.publishFrequency,
  });
  const [topicInput, setTopicInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <label className={styles.formLabel}>
          Topics <span className={styles.optional}>(optional)</span>
        </label>
        <div className={styles.topicInputGroup}>
          <input
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
            {formData.topics.map((topic, index) => (
              <span key={`topic-${index}`} className={styles.topicTag}>
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
