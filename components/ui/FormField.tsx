'use client';

import React, { forwardRef, useId } from 'react';
import styles from '@/styles/FormField.module.css';

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

interface InputFieldProps
  extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  as?: 'input';
}

interface TextareaFieldProps
  extends BaseFieldProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  as: 'textarea';
  rows?: number;
}

interface SelectFieldProps
  extends BaseFieldProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  as: 'select';
  children: React.ReactNode;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>((props, ref) => {
  const generatedId = useId();
  const {
    label,
    error,
    hint,
    required,
    optional,
    className = '',
    as = 'input',
    id,
    ...restProps
  } = props;

  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const hasError = Boolean(error);
  // Only include hintId when hint is actually rendered (hint exists AND no error)
  const describedBy = [hasError ? errorId : null, hint && !hasError ? hintId : null]
    .filter(Boolean)
    .join(' ');

  const fieldClasses = [styles.field, hasError ? styles.fieldError : '', className]
    .filter(Boolean)
    .join(' ');

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      className: styles.input,
      'aria-invalid': hasError,
      'aria-describedby': describedBy || undefined,
      'aria-required': required,
      required,
    };

    if (as === 'textarea') {
      const { rows = 4, ...textareaProps } = restProps as Omit<
        TextareaFieldProps,
        keyof BaseFieldProps
      >;
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          {...commonProps}
          {...textareaProps}
        />
      );
    }

    if (as === 'select') {
      const { children, ...selectProps } = restProps as Omit<
        SelectFieldProps,
        keyof BaseFieldProps
      >;
      return (
        <select ref={ref as React.Ref<HTMLSelectElement>} {...commonProps} {...selectProps}>
          {children}
        </select>
      );
    }

    const inputProps = restProps as Omit<InputFieldProps, keyof BaseFieldProps>;
    return <input ref={ref as React.Ref<HTMLInputElement>} {...commonProps} {...inputProps} />;
  };

  return (
    <div className={fieldClasses}>
      <label htmlFor={fieldId} className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className={styles.optional}>(optional)</span>}
      </label>

      {renderInput()}

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <svg
            className={styles.errorIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
