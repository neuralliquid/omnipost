/**
 * Automation Page - App Router
 * Shows workflow automation opportunities with ISR
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import AutomationContent from './AutomationContent';

export const metadata: Metadata = {
  title: 'Workflow Automation',
  description:
    'Leverage system architecture expertise to automate repetitive tasks in your content workflow, improving efficiency and consistency.',
  openGraph: {
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks in your content workflow',
    images: ['/images/og-automation.jpg'],
  },
};

// ISR: Revalidate every hour
export const revalidate = 3600;

async function getAutomationTools() {
  try {
    const automationTools = await import('@/data/automationTools.json');
    return { tools: automationTools.tools, error: null };
  } catch (error) {
    console.error('Error loading automation tools:', error);
    return { tools: [], error: 'Failed to load automation tools' };
  }
}

export default async function AutomationPage() {
  const { tools, error } = await getAutomationTools();

  return (
    <Suspense fallback={<AutomationSkeleton />}>
      <AutomationContent initialTools={tools} initialError={error} />
    </Suspense>
  );
}

function AutomationSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}
