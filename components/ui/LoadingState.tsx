import React from 'react';
import Image from 'next/image';
import styles from '@/styles/LoadingState.module.css';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Shared component for displaying a loading state
 */
const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', className }) => {
  return (
    <div className={className || styles.loading}>
      <div className={styles.loadingSpinner}>
        <Image src="/images/loading-spinner.svg" alt="Loading" width={50} height={50} priority />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default LoadingState;
