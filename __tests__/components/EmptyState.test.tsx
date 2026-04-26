/**
 * EmptyState Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyState from '@/components/ui/EmptyState';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items found" description="Try creating a new item." />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try creating a new item.')).toBeInTheDocument();
  });

  it('renders action link when provided', () => {
    render(<EmptyState title="No posts" action={{ label: 'Create Post', href: '/posts/new' }} />);
    const link = screen.getByText('Create Post');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/posts/new');
  });

  it('renders icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">Icon</span>;
    render(<EmptyState title="Empty" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    // No link or button should be rendered for actions
    expect(container.querySelector('a')).not.toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });
});
