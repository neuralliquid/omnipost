import React from 'react';

interface StepCardProps {
  title: string;
  items: string[];
  tip?: string;
}

/**
 * Component for displaying a step card in the workflow
 */
const StepCard: React.FC<StepCardProps> = ({ title, items, tip }) => {
  return (
    <div className="step-card">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {tip && (
        <div className="tip">
          <strong>Pro Tip:</strong> {tip}
        </div>
      )}
    </div>
  );
};

interface WorkflowStageProps {
  number?: number;
  stageNumber?: number;
  title?: string;
  stageTitle?: string;
  steps: StepCardProps[];
}

/**
 * Shared component for displaying a workflow stage with multiple steps
 * Supports both number/title and stageNumber/stageTitle prop patterns
 */
const WorkflowStage: React.FC<WorkflowStageProps> = ({ 
  number,
  stageNumber,
  title,
  stageTitle,
  steps 
}) => {
  const displayNumber = number ?? stageNumber;
  const displayTitle = title ?? stageTitle;

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        {displayNumber && <div className="stage-number">{displayNumber}</div>}
        {displayTitle && <h3 className="stage-title">{displayTitle}</h3>}
      </div>
      <div className="stage-steps">
        {steps.map((step, index) => (
          <StepCard 
            key={index}
            title={step.title}
            items={step.items}
            tip={step.tip}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkflowStage;
