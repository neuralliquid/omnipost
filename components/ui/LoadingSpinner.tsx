'use client';

import React from 'react';
import styles from '@/styles/LoadingSpinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  const wrapperClasses = [
    styles.wrapper,
    fullScreen ? styles.fullScreen : '',
    overlay ? styles.overlay : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerClasses = [styles.spinner, styles[size]].join(' ');

  return (
    <div className={wrapperClasses} role="status" aria-live="polite">
      <svg className={spinnerClasses} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={styles.indicator}
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
