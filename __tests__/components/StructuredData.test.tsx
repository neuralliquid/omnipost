/**
 * StructuredData Component Tests
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StructuredData } from '@/components/StructuredData';

describe('StructuredData', () => {
  it('renders script tag with type="application/ld+json"', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script');
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute('type', 'application/ld+json');
  });

  it('uses default structured data when no data prop', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script');
    const content = JSON.parse(script?.innerHTML ?? '{}');
    expect(content['@context']).toBe('https://schema.org');
    expect(content['@type']).toBe('SoftwareApplication');
    expect(content.name).toBe('OmniPost');
  });

  it('uses custom data when provided', () => {
    const customData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Custom Org',
      url: 'https://example.com',
    };
    const { container } = render(<StructuredData data={customData} />);
    const script = container.querySelector('script');
    const content = JSON.parse(script?.innerHTML ?? '{}');
    expect(content['@type']).toBe('Organization');
    expect(content.name).toBe('Custom Org');
  });

  it('output is valid JSON', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script');
    expect(() => JSON.parse(script?.innerHTML ?? '')).not.toThrow();
  });
});
