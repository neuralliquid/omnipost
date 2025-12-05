'use client';

/**
 * Review Workflow Client Component
 * Multi-step content review process using Server Actions
 */

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  parseContent,
  summarizeContent,
  generateImage,
  approveContent,
  ParseResult,
  SummarizeResult,
  ImageResult,
  ApproveResult,
} from './actions';
import styles from '@/styles/HumanReview.module.css';
import reviewConfig from '@/data/reviewConfig.json';

import type { ReviewStep } from '@/hooks/useReviewProcess';

// Type for review config steps
interface ReviewConfigStep {
  id: string;
  label: string;
}

/**
 * Safely stringify data - handles both string and object data
 */
function stringifyData(data: unknown): string {
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Check if image data has an imageUrl property
 */
function hasImageUrl(data: unknown): data is { imageUrl: string } {
  return typeof data === 'object' && data !== null && 'imageUrl' in data;
}

// Submit button with pending state
function SubmitButton({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className || styles.submitButton}>
      {pending ? 'Processing...' : children}
    </button>
  );
}

// Progress bar component
function ProgressBar({
  steps,
  currentStep,
}: Readonly<{
  steps: ReviewConfigStep[];
  currentStep: ReviewStep;
}>) {
  const stepOrder: ReviewStep[] = [
    'input',
    'parsing',
    'summarizing',
    'generating',
    'approving',
    'approved',
  ];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className={styles.progressBar}>
      {steps.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = step.id === currentStep;

        return (
          <div
            key={step.id}
            className={`${styles.progressStep} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
          >
            <span className={styles.stepNumber}>{index + 1}</span>
            <span className={styles.stepName}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Input step component
function InputStep({
  rawInput,
  setRawInput,
  parseAction,
}: Readonly<{
  rawInput: string;
  setRawInput: (value: string) => void;
  parseAction: (payload: FormData) => void;
}>) {
  return (
    <form action={parseAction} className={styles.reviewStage}>
      <h2>Step 1: Enter Content</h2>
      <label htmlFor="rawInput" className={styles.inputLabel}>
        Paste your raw content below:
      </label>
      <textarea
        id="rawInput"
        name="rawInput"
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        rows={10}
        className={styles.textArea}
        placeholder="Enter your content here..."
        required
      />
      <div className={styles.buttonGroup}>
        <SubmitButton>Parse Content</SubmitButton>
      </div>
    </form>
  );
}

// Summarizing step component
function SummarizingStep({
  parseResult,
  summaryAction,
  onReset,
}: Readonly<{
  parseResult: ParseResult;
  summaryAction: (payload: FormData) => void;
  onReset: () => void;
}>) {
  return (
    <form action={summaryAction} className={styles.reviewStage}>
      <h2>Step 2: Review & Summarize</h2>
      <div className={styles.parsedContent}>
        <h3>Parsed Content:</h3>
        <pre className={styles.preformatted}>{JSON.stringify(parseResult.data, null, 2)}</pre>
      </div>
      <input type="hidden" name="content" value={stringifyData(parseResult.data)} />
      <div className={styles.buttonGroup}>
        <button type="button" onClick={onReset} className={styles.secondaryButton}>
          Start Over
        </button>
        <SubmitButton>Generate Summary</SubmitButton>
      </div>
    </form>
  );
}

// Generating step component
function GeneratingStep({
  summaryResult,
  imageAction,
  onBack,
}: Readonly<{
  summaryResult: SummarizeResult;
  imageAction: (payload: FormData) => void;
  onBack: () => void;
}>) {
  const summaryText = stringifyData(summaryResult.data);
  return (
    <form action={imageAction} className={styles.reviewStage}>
      <h2>Step 3: Generate Image</h2>
      <div className={styles.summaryContent}>
        <h3>Generated Summary:</h3>
        <p className={styles.summaryText}>{summaryText}</p>
      </div>
      <input type="hidden" name="prompt" value={`Generate an image for: ${summaryText}`} />
      <div className={styles.buttonGroup}>
        <button type="button" onClick={onBack} className={styles.secondaryButton}>
          Back
        </button>
        <SubmitButton>Generate Image</SubmitButton>
      </div>
    </form>
  );
}

// Approving step component
function ApprovingStep({
  imageResult,
  summaryResult,
  approveAction,
  onBack,
}: Readonly<{
  imageResult: ImageResult;
  summaryResult: SummarizeResult | null;
  approveAction: (payload: FormData) => void;
  onBack: () => void;
}>) {
  return (
    <form action={approveAction} className={styles.reviewStage}>
      <h2>Step 4: Final Review & Approve</h2>
      <div className={styles.imagePreview}>
        <h3>Generated Image:</h3>
        {hasImageUrl(imageResult.data) ? (
          <img
            src={imageResult.data.imageUrl}
            alt="Generated content"
            className={styles.generatedImage}
          />
        ) : (
          <p className={styles.imagePlaceholder}>Image data: {JSON.stringify(imageResult.data)}</p>
        )}
      </div>
      <input type="hidden" name="summary" value={stringifyData(summaryResult?.data)} />
      <input type="hidden" name="image" value={JSON.stringify(imageResult.data)} />
      <div className={styles.buttonGroup}>
        <button type="button" onClick={onBack} className={styles.secondaryButton}>
          Back
        </button>
        <SubmitButton className={styles.approveButton}>Approve & Publish</SubmitButton>
      </div>
    </form>
  );
}

export function ReviewWorkflow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ReviewStep>('input');
  const [rawInput, setRawInput] = useState('');

  // Action states
  const [parseResult, parseAction] = useActionState<ParseResult | null, FormData>(
    parseContent,
    null
  );
  const [summaryResult, summaryAction] = useActionState<SummarizeResult | null, FormData>(
    summarizeContent,
    null
  );
  const [imageResult, imageAction] = useActionState<ImageResult | null, FormData>(
    generateImage,
    null
  );
  const [approveResult, approveAction] = useActionState<ApproveResult | null, FormData>(
    approveContent,
    null
  );

  // Error state - explicitly typed to avoid unknown inference issues
  const error: string | undefined =
    parseResult?.error ?? summaryResult?.error ?? imageResult?.error ?? approveResult?.error;

  // Update step based on results
  useEffect(() => {
    if (parseResult?.success && currentStep === 'input') {
      setCurrentStep('summarizing');
    }
  }, [parseResult, currentStep]);

  useEffect(() => {
    if (summaryResult?.success && currentStep === 'summarizing') {
      setCurrentStep('generating');
    }
  }, [summaryResult, currentStep]);

  useEffect(() => {
    if (imageResult?.success && currentStep === 'generating') {
      setCurrentStep('approving');
    }
  }, [imageResult, currentStep]);

  useEffect(() => {
    if (approveResult?.success && currentStep === 'approving') {
      setCurrentStep('approved');
      // Redirect after approval
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [approveResult, currentStep, router]);

  // Reset function
  const handleReset = () => {
    setCurrentStep('input');
    setRawInput('');
  };

  // Go back function
  const goBack = (step: ReviewStep) => {
    setCurrentStep(step);
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <InputStep rawInput={rawInput} setRawInput={setRawInput} parseAction={parseAction} />
        );
      case 'summarizing':
        if (!parseResult?.data) return null;
        return (
          <SummarizingStep
            parseResult={parseResult}
            summaryAction={summaryAction}
            onReset={handleReset}
          />
        );
      case 'generating':
        if (!summaryResult?.data) return null;
        return (
          <GeneratingStep
            summaryResult={summaryResult}
            imageAction={imageAction}
            onBack={() => goBack('summarizing')}
          />
        );
      case 'approving':
        if (!imageResult?.data) return null;
        return (
          <ApprovingStep
            imageResult={imageResult}
            summaryResult={summaryResult}
            approveAction={approveAction}
            onBack={() => goBack('generating')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.workflowContainer}>
      {error ? (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={handleReset} className={styles.resetButton}>
            Start Over
          </button>
        </div>
      ) : null}

      {currentStep === 'approved' ? (
        <div className={styles.successMessage}>
          <p>Content successfully approved! Redirecting to dashboard...</p>
        </div>
      ) : null}

      <ProgressBar steps={reviewConfig.steps as ReviewConfigStep[]} currentStep={currentStep} />

      {renderStepContent()}
    </div>
  );
}
