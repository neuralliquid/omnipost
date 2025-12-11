import React from 'react';
import Image from 'next/image';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Shared component for displaying a loading state
 */
const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', className }) => {
  return (
    <div className={className || 'loading'}>
      <div className="loading-spinner">
        <Image src="/images/loading-spinner.svg" alt="Loading" width={50} height={50} priority />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingState;
