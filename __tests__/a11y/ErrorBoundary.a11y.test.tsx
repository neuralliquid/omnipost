/**
 * ErrorBoundary Accessibility Tests - TD-07
 *
 * Tests the ErrorBoundary component for WCAG 2.1 AA compliance
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ErrorBoundary from '@/components/ErrorBoundary';

expect.extend(toHaveNoViolations);

// Test component that throws an error
const ThrowError: React.FC = () => {
  throw new Error('Test error');
};

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Accessibility', () => {
  it('should have no accessibility violations in error state', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when children render normally', async () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
