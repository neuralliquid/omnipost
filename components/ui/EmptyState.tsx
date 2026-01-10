'use client';

import React from 'react';
import styles from '@/styles/EmptyState.module.css';
import Button from './Button';

type EmptyStateVariant = 'default' | 'search' | 'error' | 'filter';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, JSX.Element> = {
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  ),
};

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}) => {
  const IconComponent = icon || defaultIcons[variant];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconWrapper}>{IconComponent}</div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && (
            <Button variant={action.variant || 'primary'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
