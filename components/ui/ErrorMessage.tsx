import React from 'react';
import styles from '@/styles/ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 * Shared component for displaying error messages
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  return (
    <div className={className || styles.errorMessage}>
      <p>{message.startsWith('Error:') ? message : `Error: ${message}`}</p>
    </div>
  );
};

export default ErrorMessage;
