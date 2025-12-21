/**
 * LoadingState Accessibility Tests - TD-07
 *
 * Tests the LoadingState component for WCAG 2.1 AA compliance
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoadingState from '@/components/ui/LoadingState';

expect.extend(toHaveNoViolations);

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; src: string; width: number; height: number }) => (
    <img alt={props.alt} src={props.src} width={props.width} height={props.height} />
  ),
}));

describe('LoadingState Accessibility', () => {
  it('should have no accessibility violations with default props', async () => {
    const { container } = render(<LoadingState />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with custom message', async () => {
    const { container } = render(
      <LoadingState message="Please wait while we load your content..." />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
