/**
 * Sequence Builder Component
 * Main component for building and editing outreach sequences
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  Sequence,
  SequenceStep,
  CreateSequenceInput,
  SequenceStepType,
} from '@/types/sequence';
import { SequenceStepEditor } from './SequenceStepEditor';
import styles from '@/styles/Sequences.module.css';

interface SequenceBuilderProps {
  sequence?: Sequence;
  onSave: (data: CreateSequenceInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DEFAULT_SCHEDULE: {
  sendingDays: DayOfWeek[];
  sendingHours: { start: string; end: string };
  timezone: string;
  maxPerDay: number;
} = {
  sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  sendingHours: { start: '09:00', end: '17:00' },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  maxPerDay: 50,
};

const createEmptyStep = (order: number, type: SequenceStepType = 'email'): SequenceStep => {
  const now = new Date().toISOString();
  const baseStep = {
    id: `temp-${Date.now()}-${order}`,
    order,
    type,
    name: `Step ${order + 1}`,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };

  // Add type-specific config
  switch (type) {
    case 'email':
      return {
        ...baseStep,
        type: 'email',
        emailConfig: {
          subject: '',
          body: '',
          trackOpens: true,
          trackClicks: true,
        },
      };
    case 'linkedin_message':
      return {
        ...baseStep,
        type: 'linkedin_message',
        linkedinConfig: {
          type: 'message',
          message: '',
        },
      };
    case 'linkedin_connection':
      return {
        ...baseStep,
        type: 'linkedin_connection',
        linkedinConfig: {
          type: 'connection_request',
          message: '',
        },
      };
    case 'linkedin_view_profile':
      return {
        ...baseStep,
        type: 'linkedin_view_profile',
        linkedinConfig: {
          type: 'view_profile',
        },
      };
    case 'wait':
      return {
        ...baseStep,
        type: 'wait',
        waitConfig: {
          duration: 1,
          unit: 'days',
        },
      };
    case 'task':
      return {
        ...baseStep,
        type: 'task',
        taskConfig: {
          title: '',
        },
      };
    case 'call':
      return {
        ...baseStep,
        type: 'call',
        callConfig: {},
      };
    case 'condition':
      return {
        ...baseStep,
        type: 'condition',
        conditionConfig: {
          condition: {
            type: 'email_opened',
          },
        },
      };
    default:
      // All known step types should be handled above
      throw new Error(`Unknown step type: ${type}`);
  }
};

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({
  sequence,
  onSave,
  onCancel,
  loading,
}) => {
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [steps, setSteps] = useState<SequenceStep[]>(
    sequence?.steps.length ? sequence.steps : [createEmptyStep(0)]
  );
  const [schedule, setSchedule] = useState(sequence?.schedule || DEFAULT_SCHEDULE);
  const [stopOnReply, setStopOnReply] = useState(sequence?.stopOnReply ?? true);
  const [stopOnBounce, setStopOnBounce] = useState(sequence?.stopOnBounce ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStepChange = useCallback((index: number, updatedStep: SequenceStep) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = updatedStep;
      return newSteps;
    });
  }, []);

  const handleAddStep = useCallback(() => {
    setSteps(prev => [...prev, createEmptyStep(prev.length)]);
  }, []);

  const handleDeleteStep = useCallback((index: number) => {
    setSteps(prev => {
      if (prev.length === 1) return prev; // Keep at least one step
      const newSteps = prev.filter((_, i) => i !== index);
      // Reorder steps
      return newSteps.map((step, i) => ({ ...step, order: i }));
    });
  }, []);

  const handleMoveStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= steps.length) return;

      setSteps(prev => {
        const newSteps = [...prev];
        const [movedStep] = newSteps.splice(fromIndex, 1);
        newSteps.splice(toIndex, 0, movedStep);
        // Reorder steps
        return newSteps.map((step, i) => ({ ...step, order: i }));
      });
    },
    [steps.length]
  );

  const handleDayToggle = (day: DayOfWeek) => {
    setSchedule(prev => ({
      ...prev,
      sendingDays: prev.sendingDays.includes(day)
        ? prev.sendingDays.filter(d => d !== day)
        : [...prev.sendingDays, day],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Sequence name is required';
    }

    if (steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    if (schedule.sendingDays.length === 0) {
      newErrors.schedule = 'Select at least one sending day';
    }

    // Validate type-specific step configurations
    steps.forEach((step, index) => {
      if (step.type === 'email') {
        if (!step.emailConfig?.subject?.trim()) {
          newErrors[`step-${index}-subject`] = 'Email subject is required';
        }
        if (!step.emailConfig?.body?.trim()) {
          newErrors[`step-${index}-body`] = 'Email body is required';
        }
      }
      if (step.type === 'linkedin_message' || step.type === 'linkedin_connection') {
        if (!step.linkedinConfig?.message?.trim()) {
          newErrors[`step-${index}-message`] = 'Message is required';
        }
      }
      if (step.type === 'task') {
        if (!step.taskConfig?.title?.trim()) {
          newErrors[`step-${index}-title`] = 'Task title is required';
        }
      }
      if (step.type === 'wait') {
        if (!step.waitConfig?.duration || step.waitConfig.duration < 1) {
          newErrors[`step-${index}-duration`] = 'Wait duration must be at least 1';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (isSubmitting) return;

    const data: CreateSequenceInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      steps: steps.map((step, index) => ({
        type: step.type,
        order: index,
        name: step.name || `Step ${index + 1}`,
        enabled: step.enabled ?? true,
        emailConfig: step.emailConfig,
        linkedinConfig: step.linkedinConfig,
        smsConfig: step.smsConfig,
        callConfig: step.callConfig,
        taskConfig: step.taskConfig,
        waitConfig: step.waitConfig,
        conditionConfig: step.conditionConfig,
      })),
      schedule,
      stopOnReply,
      stopOnBounce,
    };

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      await onSave(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save sequence';
      setErrors(prev => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.sequenceBuilder}>
      <div className={styles.builderHeader}>
        <h2 className={styles.builderTitle}>{sequence ? 'Edit Sequence' : 'Create Sequence'}</h2>
      </div>

      <div className={styles.builderSection}>
        <h3 className={styles.sectionTitle}>Basic Information</h3>

        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Sequence Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="e.g., Cold Outreach - Enterprise"
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={styles.textarea}
            rows={2}
            placeholder="Describe the purpose of this sequence..."
          />
        </div>
      </div>

      <div className={styles.builderSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Sequence Steps
            <span className={styles.stepCount}>({steps.length})</span>
          </h3>
          <button type="button" onClick={handleAddStep} className={styles.addStepButton}>
            + Add Step
          </button>
        </div>

        {errors.steps && <span className={styles.errorMessage}>{errors.steps}</span>}

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div className={styles.stepConnector}>
                  <div className={styles.connectorLine} />
                  <span className={styles.connectorLabel}>then</span>
                  <div className={styles.connectorLine} />
                </div>
              )}
              <SequenceStepEditor
                step={step}
                stepNumber={index + 1}
                onChange={updated => handleStepChange(index, updated)}
                onDelete={() => handleDeleteStep(index)}
                onMoveUp={() => handleMoveStep(index, index - 1)}
                onMoveDown={() => handleMoveStep(index, index + 1)}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={styles.builderSection}>
        <h3 className={styles.sectionTitle}>Schedule</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Sending Days</label>
          <div className={styles.daysGrid}>
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={`${styles.dayButton} ${
                  schedule.sendingDays.includes(day.value) ? styles.dayActive : ''
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {errors.schedule && <span className={styles.errorMessage}>{errors.schedule}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startTime" className={styles.label}>
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              value={schedule.sendingHours.start}
              onChange={e =>
                setSchedule(prev => ({
                  ...prev,
                  sendingHours: { ...prev.sendingHours, start: e.target.value },
                }))
              }
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="endTime" className={styles.label}>
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              value={schedule.sendingHours.end}
              onChange={e =>
                setSchedule(prev => ({
                  ...prev,
                  sendingHours: { ...prev.sendingHours, end: e.target.value },
                }))
              }
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="maxPerDay" className={styles.label}>
              Max per Day
            </label>
            <input
              type="number"
              id="maxPerDay"
              min={1}
              max={200}
              value={schedule.maxPerDay}
              onChange={e =>
                setSchedule(prev => ({
                  ...prev,
                  maxPerDay: parseInt(e.target.value, 10),
                }))
              }
              className={styles.input}
            />
          </div>
        </div>
      </div>

      <div className={styles.builderSection}>
        <h3 className={styles.sectionTitle}>Settings</h3>

        <div className={styles.settingsGrid}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={stopOnReply}
              onChange={e => setStopOnReply(e.target.checked)}
            />
            <span>Stop sequence when lead replies</span>
          </label>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={stopOnBounce}
              onChange={e => setStopOnBounce(e.target.checked)}
            />
            <span>Stop sequence on email bounce</span>
          </label>
        </div>
      </div>

      {errors.submit && (
        <div className={styles.formError} role="alert">
          {errors.submit}
        </div>
      )}

      <div className={styles.builderActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={loading || isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className={styles.saveButton} disabled={loading || isSubmitting}>
          {loading || isSubmitting ? 'Saving...' : sequence ? 'Update Sequence' : 'Create Sequence'}
        </button>
      </div>
    </form>
  );
};

export default SequenceBuilder;
