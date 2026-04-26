/**
 * LoadingSpinner Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size (md)', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('spinner');
    expect(svg).toHaveClass('md');
  });

  it('renders with sm size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('sm');
  });

  it('renders with md size', () => {
    const { container } = render(<LoadingSpinner size="md" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('md');
  });

  it('renders with lg size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('lg');
  });

  it('has role="status" for accessibility', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays default aria-label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
  });

  it('displays custom label via aria-label', () => {
    render(<LoadingSpinner label="Fetching data" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Fetching data');
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('applies correct CSS class for each size', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach(size => {
      const { container, unmount } = render(<LoadingSpinner size={size} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass(size);
      unmount();
    });
  });
});
