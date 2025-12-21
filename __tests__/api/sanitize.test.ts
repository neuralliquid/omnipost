/**
 * Sanitization Utility Tests - NEW-02 / Phase 7 Fixes Verification
 *
 * Tests covering BUG-02 XSS prevention via sanitizeText
 */

import { sanitizeText, validateAndSanitize, textInputSchema } from '@/app/api/_utils/sanitize';

describe('sanitizeText - BUG-02 Fix Verification', () => {
  it('should strip basic HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello World';
    const result = sanitizeText(input);
    expect(result).toBe('alert("xss")Hello World');
    expect(result).not.toContain('<script>');
  });

  it('should strip nested HTML tags', () => {
    const input = '<div><p><span>Nested <strong>content</strong></span></p></div>';
    const result = sanitizeText(input);
    expect(result).toBe('Nested content');
  });

  it('should preserve plain text', () => {
    const input = 'Hello World! This is plain text.';
    const result = sanitizeText(input);
    expect(result).toBe(input);
  });

  it('should handle empty string', () => {
    const input = '';
    const result = sanitizeText(input);
    expect(result).toBe('');
  });

  it('should strip event handlers in attributes', () => {
    const input = '<img src="x" onerror="alert(1)">Some text';
    const result = sanitizeText(input);
    expect(result).toBe('Some text');
    expect(result).not.toContain('onerror');
  });

  it('should strip style tags', () => {
    const input = '<style>body { display: none; }</style>Content';
    const result = sanitizeText(input);
    expect(result).toBe('body { display: none; }Content');
    expect(result).not.toContain('<style>');
  });

  it('should handle malformed HTML', () => {
    const input = '<div>Unclosed tag text';
    const result = sanitizeText(input);
    expect(result).toBe('Unclosed tag text');
  });

  it('should strip anchor tags but keep text', () => {
    const input = '<a href="javascript:alert(1)">Click me</a>';
    const result = sanitizeText(input);
    expect(result).toBe('Click me');
    expect(result).not.toContain('<a');
    expect(result).not.toContain('javascript:');
  });

  it('should handle special characters outside tags', () => {
    const input = 'Hello < World > Test';
    // Note: this will be treated as a tag, but should be handled safely
    const result = sanitizeText(input);
    // The result depends on implementation, but should not crash
    expect(typeof result).toBe('string');
  });
});

describe('validateAndSanitize - BUG-02 Fix Verification', () => {
  it('should validate and sanitize valid input', () => {
    const result = validateAndSanitize(textInputSchema, {
      rawInput: '<script>alert("xss")</script>Hello',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rawInput).not.toContain('<script>');
      expect(result.data.rawInput).toContain('Hello');
    }
  });

  it('should reject empty input', () => {
    const result = validateAndSanitize(textInputSchema, { rawInput: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject missing input', () => {
    const result = validateAndSanitize(textInputSchema, {});

    expect(result.success).toBe(false);
  });
});
