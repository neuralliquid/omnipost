/**
 * Sequence Step Editor Component
 * Editor for individual sequence steps
 */

'use client';

import React, { useState } from 'react';
import type { SequenceStep, SequenceStepType } from '@/types/sequence';
import styles from '@/styles/Sequences.module.css';

interface SequenceStepEditorProps {
  step: SequenceStep;
  stepNumber: number;
  onChange: (step: SequenceStep) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const STEP_TYPES: { value: SequenceStepType; label: string; icon: string }[] = [
  { value: 'email', label: 'Send Email', icon: '✉️' },
  { value: 'linkedin_connection', label: 'LinkedIn Connection', icon: '🔗' },
  { value: 'linkedin_message', label: 'LinkedIn Message', icon: '💬' },
  { value: 'linkedin_view_profile', label: 'View LinkedIn Profile', icon: '👁️' },
  { value: 'wait', label: 'Wait', icon: '⏳' },
  { value: 'task', label: 'Create Task', icon: '📋' },
  { value: 'call', label: 'Schedule Call', icon: '📞' },
  { value: 'condition', label: 'Condition', icon: '🔀' },
];

const WAIT_UNITS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
];

const CONDITION_TYPES = [
  { value: 'email_opened', label: 'Email Opened' },
  { value: 'email_clicked', label: 'Email Clicked' },
  { value: 'email_replied', label: 'Email Replied' },
  { value: 'linkedin_accepted', label: 'LinkedIn Connection Accepted' },
  { value: 'linkedin_replied', label: 'LinkedIn Message Replied' },
];

export const SequenceStepEditor: React.FC<SequenceStepEditorProps> = ({
  step,
  stepNumber,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTypeChange = (type: SequenceStepType) => {
    const now = new Date().toISOString();
    const baseStep: SequenceStep = {
      id: step.id,
      order: step.order,
      type,
      name: step.name,
      enabled: step.enabled,
      createdAt: step.createdAt,
      updatedAt: now,
    };

    // Set default config based on type
    switch (type) {
      case 'email':
        onChange({
          ...baseStep,
          type: 'email',
          emailConfig: {
            subject: '',
            body: '',
            trackOpens: true,
            trackClicks: true,
          },
        });
        break;
      case 'linkedin_connection':
        onChange({
          ...baseStep,
          type: 'linkedin_connection',
          linkedinConfig: {
            type: 'connection_request',
            message: '',
          },
        });
        break;
      case 'linkedin_message':
        onChange({
          ...baseStep,
          type: 'linkedin_message',
          linkedinConfig: {
            type: 'message',
            message: '',
          },
        });
        break;
      case 'linkedin_view_profile':
        onChange({
          ...baseStep,
          type: 'linkedin_view_profile',
          linkedinConfig: {
            type: 'view_profile',
          },
        });
        break;
      case 'wait':
        onChange({
          ...baseStep,
          type: 'wait',
          waitConfig: {
            duration: 1,
            unit: 'days',
          },
        });
        break;
      case 'task':
        onChange({
          ...baseStep,
          type: 'task',
          taskConfig: {
            title: '',
            description: '',
          },
        });
        break;
      case 'call':
        onChange({
          ...baseStep,
          type: 'call',
          callConfig: {
            duration: 30,
            script: '',
          },
        });
        break;
      case 'condition':
        onChange({
          ...baseStep,
          type: 'condition',
          conditionConfig: {
            condition: {
              type: 'email_opened',
            },
          },
        });
        break;
      default:
        // All known step types should be handled above
        // If we reach here, it's an unknown type - throw an error
        throw new Error(`Unknown step type: ${type}`);
    }
  };

  const handleEmailConfigChange = (key: string, value: unknown) => {
    onChange({
      ...step,
      emailConfig: {
        ...step.emailConfig,
        [key]: value,
      },
    });
  };

  const handleLinkedinConfigChange = (key: string, value: unknown) => {
    onChange({
      ...step,
      linkedinConfig: {
        ...step.linkedinConfig,
        type: step.linkedinConfig?.type || 'message',
        [key]: value,
      },
    });
  };

  const handleWaitConfigChange = (key: string, value: unknown) => {
    onChange({
      ...step,
      waitConfig: {
        duration: step.waitConfig?.duration || 1,
        unit: step.waitConfig?.unit || 'days',
        [key]: value,
      },
    });
  };

  const handleTaskConfigChange = (key: string, value: unknown) => {
    const prevTaskConfig = step.taskConfig ?? { title: '' };
    onChange({
      ...step,
      taskConfig: {
        ...prevTaskConfig,
        [key]: value,
      },
    });
  };

  const handleCallConfigChange = (key: string, value: unknown) => {
    onChange({
      ...step,
      callConfig: {
        ...step.callConfig,
        [key]: value,
      },
    });
  };

  const handleConditionConfigChange = (key: string, value: unknown) => {
    if (key === 'type') {
      onChange({
        ...step,
        conditionConfig: {
          ...step.conditionConfig,
          condition: {
            ...step.conditionConfig?.condition,
            type: value as
              | 'email_opened'
              | 'email_clicked'
              | 'email_replied'
              | 'linkedin_accepted'
              | 'linkedin_replied',
          },
        },
      });
    }
  };

  const getStepIcon = () => {
    const stepType = STEP_TYPES.find(t => t.value === step.type);
    return stepType?.icon || '📌';
  };

  const getStepLabel = () => {
    const stepType = STEP_TYPES.find(t => t.value === step.type);
    return stepType?.label || step.type;
  };

  const renderConfigEditor = () => {
    switch (step.type) {
      case 'email':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-email-subject`} className={styles.configLabel}>
                Subject Line
              </label>
              <input
                id={`step-${step.id}-email-subject`}
                type="text"
                value={step.emailConfig?.subject || ''}
                onChange={e => handleEmailConfigChange('subject', e.target.value)}
                className={styles.configInput}
                placeholder="Enter email subject..."
              />
            </div>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-email-body`} className={styles.configLabel}>
                Email Body
              </label>
              <textarea
                id={`step-${step.id}-email-body`}
                value={step.emailConfig?.body || ''}
                onChange={e => handleEmailConfigChange('body', e.target.value)}
                className={styles.configTextarea}
                rows={6}
                placeholder="Write your email content... Use {{firstName}}, {{lastName}}, {{company}} for personalization"
              />
            </div>
            <div className={styles.configCheckboxes}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={step.emailConfig?.trackOpens ?? true}
                  onChange={e => handleEmailConfigChange('trackOpens', e.target.checked)}
                />
                Track Opens
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={step.emailConfig?.trackClicks ?? true}
                  onChange={e => handleEmailConfigChange('trackClicks', e.target.checked)}
                />
                Track Clicks
              </label>
            </div>
          </div>
        );

      case 'linkedin_connection':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label
                htmlFor={`step-${step.id}-linkedin-connection-message`}
                className={styles.configLabel}
              >
                Connection Message (Optional)
              </label>
              <textarea
                id={`step-${step.id}-linkedin-connection-message`}
                value={step.linkedinConfig?.message || ''}
                onChange={e => handleLinkedinConfigChange('message', e.target.value)}
                className={styles.configTextarea}
                rows={3}
                placeholder="Hi {{firstName}}, I'd love to connect..."
                maxLength={300}
              />
              <span className={styles.charCount}>
                {(step.linkedinConfig?.message || '').length}/300 characters
              </span>
            </div>
          </div>
        );

      case 'linkedin_message':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-linkedin-message`} className={styles.configLabel}>
                Message
              </label>
              <textarea
                id={`step-${step.id}-linkedin-message`}
                value={step.linkedinConfig?.message || ''}
                onChange={e => handleLinkedinConfigChange('message', e.target.value)}
                className={styles.configTextarea}
                rows={4}
                placeholder="Hi {{firstName}}, following up on..."
              />
            </div>
          </div>
        );

      case 'linkedin_view_profile':
        return (
          <div className={styles.stepConfig}>
            <p className={styles.configHint}>
              This step will view the prospect's LinkedIn profile. No configuration needed.
            </p>
          </div>
        );

      case 'wait':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configRow}>
              <div className={styles.configField}>
                <label htmlFor={`step-${step.id}-wait-duration`} className={styles.configLabel}>
                  Duration
                </label>
                <input
                  id={`step-${step.id}-wait-duration`}
                  type="number"
                  min={1}
                  value={step.waitConfig?.duration || 1}
                  onChange={e => handleWaitConfigChange('duration', parseInt(e.target.value, 10))}
                  className={styles.configInputSmall}
                />
              </div>
              <div className={styles.configField}>
                <label htmlFor={`step-${step.id}-wait-unit`} className={styles.configLabel}>
                  Unit
                </label>
                <select
                  id={`step-${step.id}-wait-unit`}
                  value={step.waitConfig?.unit || 'days'}
                  onChange={e => handleWaitConfigChange('unit', e.target.value)}
                  className={styles.configSelect}
                >
                  {WAIT_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'task':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-task-title`} className={styles.configLabel}>
                Task Title
              </label>
              <input
                id={`step-${step.id}-task-title`}
                type="text"
                value={step.taskConfig?.title || ''}
                onChange={e => handleTaskConfigChange('title', e.target.value)}
                className={styles.configInput}
                placeholder="Follow up with {{firstName}}"
              />
            </div>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-task-description`} className={styles.configLabel}>
                Description
              </label>
              <textarea
                id={`step-${step.id}-task-description`}
                value={step.taskConfig?.description || ''}
                onChange={e => handleTaskConfigChange('description', e.target.value)}
                className={styles.configTextarea}
                rows={3}
                placeholder="Task details..."
              />
            </div>
          </div>
        );

      case 'call':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configRow}>
              <div className={styles.configField}>
                <label htmlFor={`step-${step.id}-call-duration`} className={styles.configLabel}>
                  Duration (minutes)
                </label>
                <input
                  id={`step-${step.id}-call-duration`}
                  type="number"
                  min={5}
                  step={5}
                  value={step.callConfig?.duration || 30}
                  onChange={e => handleCallConfigChange('duration', parseInt(e.target.value, 10))}
                  className={styles.configInputSmall}
                />
              </div>
            </div>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-call-script`} className={styles.configLabel}>
                Call Script
              </label>
              <textarea
                id={`step-${step.id}-call-script`}
                value={step.callConfig?.script || ''}
                onChange={e => handleCallConfigChange('script', e.target.value)}
                className={styles.configTextarea}
                rows={4}
                placeholder="Key talking points..."
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label htmlFor={`step-${step.id}-condition-type`} className={styles.configLabel}>
                Condition Type
              </label>
              <select
                id={`step-${step.id}-condition-type`}
                value={step.conditionConfig?.condition?.type || 'email_opened'}
                onChange={e => handleConditionConfigChange('type', e.target.value)}
                className={styles.configSelect}
              >
                {CONDITION_TYPES.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
            <p className={styles.configHint}>
              Branch logic will be evaluated when this step is reached. Configure branches in the
              full sequence editor.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.stepEditor}>
      <div className={styles.stepHeader}>
        <div className={styles.stepDragHandle}>⋮⋮</div>
        <span className={styles.stepNumber}>{stepNumber}</span>
        <span className={styles.stepIcon}>{getStepIcon()}</span>

        <select
          aria-label="Step type"
          value={step.type}
          onChange={e => handleTypeChange(e.target.value as SequenceStepType)}
          className={styles.stepTypeSelect}
        >
          {STEP_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <div className={styles.stepActions}>
          {!isFirst && onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className={styles.stepActionButton}
              title="Move up"
            >
              ↑
            </button>
          )}
          {!isLast && onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className={styles.stepActionButton}
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.stepActionButton}
            aria-label={isExpanded ? 'Collapse step' : 'Expand step'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.stepActionButton} ${styles.deleteStepButton}`}
            aria-label="Delete step"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && <div className={styles.stepBody}>{renderConfigEditor()}</div>}
    </div>
  );
};

export default SequenceStepEditor;
