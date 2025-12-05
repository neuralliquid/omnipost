import { useState, useEffect } from 'react';
import { AutomationTool } from '../types/automation';

/**
 * Custom hook for managing automation tools data with loading and error states
 * @param initialTools - Pre-loaded tools from server-side rendering
 * @param initialError - Error from server-side rendering, if any
 */
export function useAutomationTools(
  initialTools: AutomationTool[] = [],
  initialError: string | null = null
) {
  const [tools, setTools] = useState<AutomationTool[]>(initialTools);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialTools.length === 0 && !initialError);
  const [error, setError] = useState<string | null>(initialError);

  // Fetch automation tools if not provided initially and no error from server
  useEffect(() => {
    const fetchAutomationTools = async () => {
      // If we have an initial error from the server, don't fetch
      if (initialError) {
        setIsLoading(false);
        return;
      }

      // If we already have tools from props, don't fetch
      if (initialTools.length > 0) {
        setTools(initialTools);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // For now, we'll simulate a data fetch with a timeout
        await new Promise(resolve => setTimeout(resolve, 500));

        // Import tools from JSON
        const automationTools = await import('../data/automationTools.json');
        setTools(automationTools.tools);
      } catch (err) {
        console.error('Error fetching automation tools:', err);
        setError('Failed to load automation tools. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAutomationTools();
  }, [initialTools, initialError]);

  // Handle tool selection
  const selectTool = (toolId: string) => {
    setSelectedTool(toolId);
  };

  // Close tool detail view
  const closeTool = () => {
    setSelectedTool(null);
  };

  return {
    tools,
    selectedTool,
    isLoading,
    error,
    selectTool,
    closeTool,
  };
}
