'use client';

import React, { forwardRef } from 'react';
import styles from '@/styles/Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

interface ButtonAsButtonProps
  extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  as?: 'button';
  href?: never;
  className?: string;
}

interface ButtonAsAnchorProps
  extends BaseButtonProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  as: 'a';
  href: string;
  disabled?: boolean;
  className?: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const LoadingSpinner = () => (
  <svg
    className={styles.spinner}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    ...restProps
  } = props;

  const isDisabled = disabled || loading;

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
      <span className={styles.text}>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
    </>
  );

  if (props.as === 'a') {
    const {
      as: _as,
      href,
      onClick,
      ...anchorProps
    } = restProps as Omit<ButtonAsAnchorProps, keyof BaseButtonProps | 'className' | 'disabled'> & {
      as?: 'a';
      href: string;
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={buttonClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={handleClick}
        {...anchorProps}
      >
        {content}
      </a>
    );
  }

  const {
    as: _as,
    type = 'button',
    ...buttonProps
  } = restProps as Omit<ButtonAsButtonProps, keyof BaseButtonProps | 'className' | 'disabled'> & {
    as?: 'button';
    type?: 'button' | 'submit' | 'reset';
  };

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      aria-busy={loading}
      {...buttonProps}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
