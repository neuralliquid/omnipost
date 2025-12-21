/**
 * Accessibility Testing Setup - TD-07
 *
 * This file configures jest-axe for automated accessibility testing.
 * All accessibility tests should import from this file to ensure consistent configuration.
 */

import { toHaveNoViolations, axe } from 'jest-axe';

// Extend Jest matchers with accessibility assertions
expect.extend(toHaveNoViolations);

/**
 * axe-core configuration for WCAG 2.1 AA standards
 * These are the project's accessibility compliance requirements
 */
export const axeOptions = {
  rules: {
    // Disable region rule for component-level tests (not full pages)
    region: { enabled: false },
  },
};

/**
 * Helper function to run accessibility tests on rendered components
 * @param container - The container element from render()
 * @returns Promise with axe results
 */
export async function checkAccessibility(container: HTMLElement) {
  return axe(container, axeOptions);
}

export { toHaveNoViolations, axe };
