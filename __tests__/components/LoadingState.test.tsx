/**
 * LoadingState Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingState from '@/components/ui/LoadingState';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

describe('LoadingState', () => {
  it('renders with default loading message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders loading spinner image', () => {
    render(<LoadingState />);
    expect(screen.getByAltText('Loading')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<LoadingState className="custom-loading" />);
    expect(container.firstChild).toHaveClass('custom-loading');
  });
});
