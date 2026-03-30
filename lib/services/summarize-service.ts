/**
 * Summarize Service
 * Core business logic for text summarization operations
 */

import axios from 'axios';
import featureFlags from '@/lib/featureFlags';
import { isGatewayEnabled, gatewayPost, shouldFallbackToDirectCalls } from '@/lib/clients/sluice-gateway';

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
  if (!featureFlags.summarization?.enabled) {
    return {
      success: false,
      error: 'Summarization feature is disabled',
      statusCode: 403,
    };
  }

  // Try Sluice gateway first if enabled
  if (isGatewayEnabled()) {
    const implementation = featureFlags.summarization?.implementation || 'huggingface';
    const gatewayResult = await gatewayPost('/v1/responses', {
      model: implementation,
      text: rawText,
    }, { operation: 'summarize_text' });

    if (gatewayResult.success) {
      return { success: true, data: gatewayResult.data };
    }

    if (!shouldFallbackToDirectCalls()) {
      return {
        success: false,
        error: gatewayResult.error || 'Gateway request failed',
        statusCode: gatewayResult.statusCode || 502,
      };
    }
  }

  try {
    const apiConfig = getApiConfig();
    const response = await axios.post(apiConfig.summarizationUrl, { text: rawText });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to summarize text';
    return {
      success: false,
      error: message,
      statusCode: 500,
    };
  }
}

/**
 * Approve a summary using the configured AI service
 * @param summary - The summary to approve
 * @returns SummarizeServiceResult with the approval result or error
 */
export async function approveSummary(summary: string): Promise<SummarizeServiceResult> {
  try {
    const apiConfig = getApiConfig();
    const response = await axios.post(apiConfig.approvalUrl, { summary });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve summary';
    return {
      success: false,
      error: message,
      statusCode: 500,
    };
  }
}
