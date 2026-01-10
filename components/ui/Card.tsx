'use client';

import React, { forwardRef } from 'react';
import styles from '@/styles/Card.module.css';

/**
 * Props for the Card component
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant of the card */
  variant?: 'default' | 'interactive' | 'outlined';
  /** Internal padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** HTML element to render as */
  as?: 'div' | 'article' | 'section';
}

/**
 * Props for the CardHeader component
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header title text */
  title?: string;
  /** Header subtitle text */
  subtitle?: string;
  /** Action element (e.g., button) to display in the header */
  action?: React.ReactNode;
}

/**
 * Props for the CardBody component
 */
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Props for the CardFooter component
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of footer content */
  align?: 'left' | 'center' | 'right' | 'between';
}

/**
 * Card component for displaying content in a contained box with optional styling variants.
 *
 * @example
 * ```tsx
 * <Card variant="interactive" padding="lg">
 *   <CardHeader title="My Card" subtitle="Description" />
 *   <CardBody>Content goes here</CardBody>
 *   <CardFooter align="right">
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = 'default', padding = 'md', className = '', as = 'div', ...props },
    ref
  ) => {
    const Component = as;
    const cardClasses = [styles.card, styles[variant], styles[`padding-${padding}`], className]
      .filter(Boolean)
      .join(' ');

    return (
      <Component ref={ref} className={cardClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader component for displaying a header section within a Card.
 * Supports title, subtitle, and optional action elements.
 */
const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      {(title || subtitle) && (
        <div className={styles.headerContent}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {children}
      {action && <div className={styles.headerAction}>{action}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * CardBody component for the main content area of a Card.
 */
const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.body} ${className}`} {...props}>
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

/**
 * CardFooter component for displaying actions or additional info at the bottom of a Card.
 * Supports different alignment options for its content.
 */
const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  className = '',
  ...props
}) => {
  const footerClasses = [styles.footer, styles[`align-${align}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={footerClasses} {...props}>
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
