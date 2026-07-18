/**
 * PageSkeleton Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PageSkeleton from '@/components/ui/PageSkeleton';

describe('PageSkeleton', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<PageSkeleton rows={5} />);
    // Each row contains a row div with a rowLine div inside, so filter to direct row children
    const rowContainer = container.querySelector('[class*="rows"]');
    expect(rowContainer).toBeInTheDocument();
    expect(rowContainer?.children).toHaveLength(5);
  });

  it('shows header skeleton when showHeader=true', () => {
    const { container } = render(<PageSkeleton showHeader />);
    const header = container.querySelector('[class*="header"]');
    expect(header).toBeInTheDocument();
  });

  it('does not show header skeleton when showHeader=false', () => {
    const { container } = render(<PageSkeleton showHeader={false} />);
    // The rows container has class "rows", the header has class "header"
    // We check there is no element with headerTitle class
    const headerTitle = container.querySelector('[class*="headerTitle"]');
    expect(headerTitle).not.toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<PageSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('default rows count works (defaults to 3)', () => {
    const { container } = render(<PageSkeleton />);
    const rowContainer = container.querySelector('[class*="rows"]');
    expect(rowContainer?.children).toHaveLength(3);
  });
});
