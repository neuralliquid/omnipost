/**
 * Summarize Service
 * Core business logic for text summarization operations
 */

import axios from 'axios';
import featureFlags from '@/lib/featureFlags';

// Helper function to get API configuration
const getApiConfig = () => {
  return {
    summarizationUrl: process.env.SUMMARIZATION_API_URL || 'https://api.summarization.ai/summarize',
    approvalUrl: process.env.APPROVAL_API_URL || 'https://api.summarization.ai/approve',
  } as const;
};

export interface SummarizeServiceResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

/**
 * Summarize text content using the configured AI service
 * @param rawText - The raw text input to summarize
 * @returns SummarizeServiceResult with the summary or error
 */
export async function summarizeText(rawText: string): Promise<SummarizeServiceResult> {
  // Check if summarization feature is enabled
  if (!featureFlags.summarization) {
    return {
      success: false,
      error: 'Summarization feature is disabled',
      statusCode: 403,
    };
  }

  const apiConfig = getApiConfig();
  const response = await axios.post(apiConfig.summarizationUrl, { text: rawText });

  return {
    success: true,
    data: response.data,
  };
}

/**
 * Approve a summary using the configured AI service
 * @param summary - The summary to approve
 * @returns SummarizeServiceResult with the approval result or error
 */
export async function approveSummary(summary: string): Promise<SummarizeServiceResult> {
  const apiConfig = getApiConfig();
  const response = await axios.post(apiConfig.approvalUrl, { summary });

  return {
    success: true,
    data: response.data,
  };
}
