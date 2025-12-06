/**
 * Input Sanitization and Validation Utilities
 *
 * This module provides functions to sanitize and validate user input
 * to prevent XSS, injection attacks, and other security vulnerabilities.
 *
 * Uses:
 * - DOMPurify for HTML sanitization (client-side only)
 * - Zod for runtime type validation
 * - Server-side: simple HTML stripping for safety
 */

import { z } from 'zod';

// Server-side fallback sanitization
function stripHtmlTags(input: string): string {
  // Remove HTML tags using regex
  return input.replace(/<[^>]*>/g, '');
}

// Lazy load DOMPurify only on client-side
let DOMPurify: any = null;
if (typeof window !== 'undefined') {
  // Client-side only
  import('dompurify').then(module => {
    DOMPurify = module.default;
  });
}

// Type definition for DOMPurify config
interface DOMPurifyConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  KEEP_CONTENT?: boolean;
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param input - Raw HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
  input: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }
): string {
  // Server-side: strip all HTML tags for safety
  if (typeof window === 'undefined' || !DOMPurify) {
    return stripHtmlTags(input);
  }

  // Client-side: use DOMPurify
  const config: DOMPurifyConfig = {
    ALLOWED_TAGS: options?.allowedTags || [],
    ALLOWED_ATTR: options?.allowedAttributes || [],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitizes plain text by stripping all HTML tags
 * @param input - Raw text that may contain HTML
 * @returns Plain text with HTML removed
 */
export function sanitizeText(input: string): string {
  // Server-side: use simple regex stripping
  if (typeof window === 'undefined' || !DOMPurify) {
    return stripHtmlTags(input);
  }

  // Client-side: use DOMPurify
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Zod schema for validating text input
 */
export const textInputSchema = z.object({
  rawInput: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(1_000_000, 'Input too large (max 1MB)')
    .transform(val => sanitizeText(val)),
});

/**
 * Zod schema for validating context input for image generation
 */
export const imageContextSchema = z.object({
  context: z
    .string()
    .min(1, 'Context cannot be empty')
    .max(10_000, 'Context too large (max 10,000 characters)')
    .transform(val => sanitizeText(val)),
});

/**
 * Zod schema for validating raw text for summarization
 */
export const summarizeTextSchema = z.object({
  rawText: z
    .string()
    .min(1, 'Text cannot be empty')
    .max(100_000, 'Text too large (max 100,000 characters)')
    .transform(val => sanitizeText(val)),
});

/**
 * Zod schema for validating notification input
 */
export const notificationSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10_000, 'Message too large')
    .transform(val => sanitizeText(val)),
  type: z.enum(['email', 'slack', 'sms']),
  recipient: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.string().min(1, 'Recipient required')),
});

/**
 * Zod schema for validating feedback input
 */
export const feedbackSchema = z.object({
  message: z
    .string()
    .min(1, 'Feedback message cannot be empty')
    .max(5_000, 'Feedback too long (max 5,000 characters)')
    .transform(val => sanitizeText(val)),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  category: z.enum(['bug', 'feature', 'improvement', 'other']).optional(),
});

/**
 * Validates and sanitizes input using a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Raw input data
 * @returns Validation result with sanitized data or errors
 */
export function validateAndSanitize<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Sanitizes a URL to prevent SSRF attacks
 * @param url - URL to sanitize
 * @param allowedDomains - List of allowed domains (optional)
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string, allowedDomains?: string[]): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Check against allowed domains if provided
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        return null;
      }
    }

    // Prevent private IP ranges (basic check)
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname.startsWith('127.') ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.startsWith('172.16.')
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates JSON input
 * @param input - String that should be JSON
 * @returns Parsed JSON object or null if invalid
 */
export function validateJson(input: string): object | null {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
