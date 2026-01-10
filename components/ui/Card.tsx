'use client';

import React, { forwardRef } from 'react';
import styles from '@/styles/Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

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

const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.body} ${className}`} {...props}>
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

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
