/**
 * Sequence Step Editor Component
 * Editor for individual sequence steps
 */

'use client';

import React, { useState } from 'react';
import type { SequenceStep, StepType } from '@/types/sequence';
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

const STEP_TYPES: { value: StepType; label: string; icon: string }[] = [
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

  const handleTypeChange = (type: StepType) => {
    const baseStep = {
      ...step,
      type,
      config: {},
    };

    // Set default config based on type
    switch (type) {
      case 'email':
        baseStep.config = {
          subject: '',
          body: '',
          trackOpens: true,
          trackClicks: true,
        };
        break;
      case 'linkedin_connection':
        baseStep.config = {
          message: '',
        };
        break;
      case 'linkedin_message':
        baseStep.config = {
          message: '',
        };
        break;
      case 'wait':
        baseStep.config = {
          duration: 1,
          unit: 'days',
        };
        break;
      case 'task':
        baseStep.config = {
          title: '',
          description: '',
          priority: 'medium',
        };
        break;
      case 'call':
        baseStep.config = {
          duration: 30,
          script: '',
        };
        break;
      case 'condition':
        baseStep.config = {
          conditionType: 'email_opened',
          trueBranch: [],
          falseBranch: [],
        };
        break;
    }

    onChange(baseStep);
  };

  const handleConfigChange = (key: string, value: unknown) => {
    onChange({
      ...step,
      config: {
        ...step.config,
        [key]: value,
      },
    });
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
              <label className={styles.configLabel}>Subject Line</label>
              <input
                type="text"
                value={step.config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className={styles.configInput}
                placeholder="Enter email subject..."
              />
            </div>
            <div className={styles.configField}>
              <label className={styles.configLabel}>Email Body</label>
              <textarea
                value={step.config.body || ''}
                onChange={(e) => handleConfigChange('body', e.target.value)}
                className={styles.configTextarea}
                rows={6}
                placeholder="Write your email content... Use {{firstName}}, {{lastName}}, {{company}} for personalization"
              />
            </div>
            <div className={styles.configCheckboxes}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={step.config.trackOpens ?? true}
                  onChange={(e) => handleConfigChange('trackOpens', e.target.checked)}
                />
                Track Opens
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={step.config.trackClicks ?? true}
                  onChange={(e) => handleConfigChange('trackClicks', e.target.checked)}
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
              <label className={styles.configLabel}>Connection Message (Optional)</label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                className={styles.configTextarea}
                rows={3}
                placeholder="Hi {{firstName}}, I'd love to connect..."
                maxLength={300}
              />
              <span className={styles.charCount}>
                {(step.config.message || '').length}/300 characters
              </span>
            </div>
          </div>
        );

      case 'linkedin_message':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configField}>
              <label className={styles.configLabel}>Message</label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
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
                <label className={styles.configLabel}>Duration</label>
                <input
                  type="number"
                  min={1}
                  value={step.config.duration || 1}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value, 10))}
                  className={styles.configInputSmall}
                />
              </div>
              <div className={styles.configField}>
                <label className={styles.configLabel}>Unit</label>
                <select
                  value={step.config.unit || 'days'}
                  onChange={(e) => handleConfigChange('unit', e.target.value)}
                  className={styles.configSelect}
                >
                  {WAIT_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
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
              <label className={styles.configLabel}>Task Title</label>
              <input
                type="text"
                value={step.config.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                className={styles.configInput}
                placeholder="Follow up with {{firstName}}"
              />
            </div>
            <div className={styles.configField}>
              <label className={styles.configLabel}>Description</label>
              <textarea
                value={step.config.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                className={styles.configTextarea}
                rows={3}
                placeholder="Task details..."
              />
            </div>
            <div className={styles.configField}>
              <label className={styles.configLabel}>Priority</label>
              <select
                value={step.config.priority || 'medium'}
                onChange={(e) => handleConfigChange('priority', e.target.value)}
                className={styles.configSelect}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        );

      case 'call':
        return (
          <div className={styles.stepConfig}>
            <div className={styles.configRow}>
              <div className={styles.configField}>
                <label className={styles.configLabel}>Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={step.config.duration || 30}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value, 10))}
                  className={styles.configInputSmall}
                />
              </div>
            </div>
            <div className={styles.configField}>
              <label className={styles.configLabel}>Call Script</label>
              <textarea
                value={step.config.script || ''}
                onChange={(e) => handleConfigChange('script', e.target.value)}
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
              <label className={styles.configLabel}>Condition Type</label>
              <select
                value={step.config.conditionType || 'email_opened'}
                onChange={(e) => handleConfigChange('conditionType', e.target.value)}
                className={styles.configSelect}
              >
                {CONDITION_TYPES.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
            <p className={styles.configHint}>
              Branch logic will be evaluated when this step is reached.
              Configure branches in the full sequence editor.
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
          value={step.type}
          onChange={(e) => handleTypeChange(e.target.value as StepType)}
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
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.stepActionButton} ${styles.deleteStepButton}`}
            title="Delete step"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.stepBody}>
          {renderConfigEditor()}
        </div>
      )}
    </div>
  );
};

export default SequenceStepEditor;
