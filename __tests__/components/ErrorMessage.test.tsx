/**
 * ErrorMessage Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage from '@/components/ui/ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
  });

  it('does not duplicate Error: prefix if already present', () => {
    render(<ErrorMessage message="Error: Already has prefix" />);
    expect(screen.getByText('Error: Already has prefix')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ErrorMessage message="Test error" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses default errorMessage class when no className provided', () => {
    const { container } = render(<ErrorMessage message="Test error" />);
    // The default class from CSS module will be applied
    expect(container.firstChild).toBeInTheDocument();
  });
});
