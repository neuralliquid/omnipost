/**
 * Validates that a value is a non-empty string
 * @param value The value to validate
 * @param fieldName The name of the field (for error messages)
 * @returns An error message if invalid, undefined if valid
 */
export function validateString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }

  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }

  if (value.trim() === '') {
    return `${fieldName} cannot be empty`;
  }

  return undefined;
}

/**
 * Validates that a value is a boolean
 * @param value The value to validate
 * @param fieldName The name of the field (for error messages)
 * @returns An error message if invalid, undefined if valid
 */
export function validateBoolean(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }

  if (typeof value !== 'boolean') {
    return `${fieldName} must be a boolean`;
  }

  return undefined;
}

/**
 * Validates that a value is an array
 * @param value The value to validate
 * @param fieldName The name of the field (for error messages)
 * @returns An error message if invalid, undefined if valid
 */
export function validateArray(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }

  if (!Array.isArray(value)) {
    return `${fieldName} must be an array`;
  }

  return undefined;
}

/**
 * Validates that a value is one of the allowed values
 * @param value The value to validate
 * @param allowedValues Array of allowed values
 * @param fieldName The name of the field (for error messages)
 * @returns An error message if invalid, undefined if valid
 */
export function validateEnum<T>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): string | undefined {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }

  // Type guard to check if value is in allowedValues
  if (!allowedValues.some(allowed => allowed === value)) {
    return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
  }

  return undefined;
}

/**
 * Validates an object against a schema of validation functions
 * @param obj The object to validate
 * @param schema An object mapping field names to validation functions
 * @returns An object with validation errors, or null if valid
 */
export function validateObject<T extends Record<string, unknown>>(
  obj: T,
  schema: Record<string, (value: unknown) => string | undefined>
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(schema)) {
    const error = validator(obj[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Validates that an object only contains allowed properties
 * @param obj The object to validate
 * @param allowedProps Array of allowed property names
 * @returns An array of invalid property names, or null if all are valid
 */
export function validateAllowedProperties<T extends Record<string, unknown>>(
  obj: T,
  allowedProps: string[]
): string[] | null {
  const invalidProps = Object.keys(obj).filter(prop => !allowedProps.includes(prop));
  return invalidProps.length > 0 ? invalidProps : null;
}

// ============ Form Field Validation ============

import type { FormField } from '@/types/survey';

/**
 * ReDoS-safe email validation
 */
export function validateEmail(label: string, value: unknown): string | null {
  const emailValue = String(value);

  // Length check to prevent DoS
  if (emailValue.length > 254) {
    return `${label} is too long for an email address`;
  }

  // Simple validation: must have exactly one @, something before and after, and a dot after @
  const atIndex = emailValue.indexOf('@');
  const lastAtIndex = emailValue.lastIndexOf('@');

  if (atIndex < 1 || atIndex !== lastAtIndex || atIndex >= emailValue.length - 1) {
    return `${label} must be a valid email address`;
  }

  const domain = emailValue.slice(atIndex + 1);
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return `${label} must be a valid email address`;
  }

  return null;
}

/**
 * Text length validation
 */
export function validateTextLength(
  label: string,
  value: unknown,
  minLength?: number,
  maxLength?: number
): string | null {
  const strValue = String(value);

  if (minLength !== undefined && strValue.length < minLength) {
    return `${label} must be at least ${minLength} characters`;
  }

  if (maxLength !== undefined && strValue.length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }

  return null;
}

/**
 * Number validation with min/max
 */
export function validateNumber(
  label: string,
  value: unknown,
  min?: number,
  max?: number
): string | null {
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return `${label} must be a valid number`;
  }

  if (min !== undefined && numValue < min) {
    return `${label} must be at least ${min}`;
  }

  if (max !== undefined && numValue > max) {
    return `${label} must be at most ${max}`;
  }

  return null;
}

/**
 * Validate a single form field value
 * Returns error message if invalid, null if valid
 */
export function validateFormField(
  field: FormField,
  value: unknown
): string | null {
  // Required validation
  if (field.validation?.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label} is required`;
    }
  }

  // Skip further validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Type-specific validation
  switch (field.type) {
    case 'email':
      return validateEmail(field.label, value);

    case 'number':
      return validateNumber(
        field.label,
        value,
        field.validation?.min,
        field.validation?.max
      );

    case 'text':
    case 'textarea':
    default:
      return validateTextLength(
        field.label,
        value,
        field.validation?.minLength,
        field.validation?.maxLength
      );
  }
}

/**
 * Validate all form fields and return array of errors
 */
export function validateFormSubmission(
  fields: FormField[],
  responses: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  for (const field of fields) {
    const value = responses[field.name];
    const error = validateFormField(field, value);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  maxPageSize: number = 100
): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
  );
  return { page, pageSize };
}
