import React from 'react';
import dynamic from 'next/dynamic';
// BUG-04 Fix: Import ErrorBoundary for component-level error isolation
import ErrorBoundary from '../ErrorBoundary';
import styles from '../../styles/HumanReview.module.css';

// Dynamic import for the TextParser component
const TextParser = dynamic(() => import('../text/TextParser'), {
  loading: () => <p className={styles.loadingComponent}>Loading text parser...</p>,
  ssr: true,
});

interface ParsingStageProps {
  rawInput: string;
  onReset: () => void;
  onNext: () => void;
  isDisabled: boolean;
}

/**
 * Component for the parsing stage of the review process
 */
const ParsingStage: React.FC<ParsingStageProps> = ({ rawInput, onReset, onNext, isDisabled }) => {
  return (
    <div className={styles.parsingStage}>
      <h2>Parsed Content</h2>
      {/* BUG-04 Fix: Wrap dynamically loaded component in ErrorBoundary
          to prevent parsing errors from crashing the entire review flow */}
      <ErrorBoundary>
        <TextParser rawInput={rawInput} />
      </ErrorBoundary>
      <div className={styles.actionButtons}>
        <button className={styles.secondaryButton} onClick={onReset} disabled={isDisabled}>
          Start Over
        </button>
        <button className={styles.primaryButton} onClick={onNext} disabled={isDisabled}>
          Generate Summary
        </button>
      </div>
    </div>
  );
};

export default ParsingStage;
