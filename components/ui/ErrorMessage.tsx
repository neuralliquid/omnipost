import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 * Shared component for displaying error messages
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  return (
    <div className={className || 'error-message'}>
      <p>{message.startsWith('Error:') ? message : `Error: ${message}`}</p>
    </div>
  );
};

export default ErrorMessage;
