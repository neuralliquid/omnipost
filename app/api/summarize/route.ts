import axios from 'axios';
import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { isAuthenticated } from '../_utils/auth';
import { Errors, withErrorHandling } from '../_utils/errors';
import { summarizeTextSchema, validateAndSanitize, sanitizeText } from '../_utils/sanitize';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';
import { z } from 'zod';

// Import feature flags from utils
import featureFlags from '../../../lib/featureFlags';

/**
 * Zod schema for validating approval request input
 */
const ApprovalRequestSchema = z.object({
  summary: z
    .string()
    .min(1, 'Summary cannot be empty')
    .max(100_000, 'Summary too large (max 100,000 characters)')
    .transform(val => sanitizeText(val)),
});

/**
 * Retrieves API configuration from environment variables.
 *
 * This function loads the summarization and approval API URLs from environment
 * variables. Both URLs must be configured for the summarization feature to work.
 *
 * @returns Object containing summarizationUrl and approvalUrl
 * @throws {Error} If SUMMARIZATION_API_URL or APPROVAL_API_URL environment variables are not set
 */
function getApiConfig(): { summarizationUrl: string; approvalUrl: string } {
  const summarizationUrl = process.env.SUMMARIZATION_API_URL;
  const approvalUrl = process.env.APPROVAL_API_URL;

  if (!summarizationUrl || !approvalUrl) {
    throw new Error(
      'Missing required environment variables: SUMMARIZATION_API_URL and APPROVAL_API_URL must be configured'
    );
  }

  return { summarizationUrl, approvalUrl };
}

/**
 * Validates authentication and feature flag
 */
async function validateAuthAndFeature() {
  if (!(await isAuthenticated())) {
    return Errors.unauthorized('Authentication required to summarize text');
  }

  if (!featureFlags.summarization) {
    return Errors.forbidden('Summarization feature is disabled');
  }

  return null;
}


/**
 * Logs an error and returns an error response
 */
async function handleError(error: unknown, action: string, message: string) {
  console.error(`${action} error:`, error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Log failure
  const logEntry = await createLogEntry(`${action}_FAILURE`, {
    error: errorMessage,
  });
  await logToAuditTrail(logEntry);

  return Errors.internalServerError(`Failed to ${message}`, {
    details: errorMessage,
  });
}

/**
 * Calls the summarization API
 */
async function callSummarizationApi(rawText: string) {
  const apiConfig = getApiConfig();
  return await axios.post(apiConfig.summarizationUrl, { text: rawText });
}

/**
 * Calls the approval API
 */
async function callApprovalApi(summary: string) {
  const apiConfig = getApiConfig();
  return await axios.post(apiConfig.approvalUrl, { summary });
}

// Summarize text endpoint with rate limiting
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    // Check authentication and feature flag
    const authError = await validateAuthAndFeature();
    if (authError) return authError;

    try {
      const body = await request.json();

      // Validate and sanitize input using Zod schema
      const validation = validateAndSanitize(summarizeTextSchema, body);
      if (!validation.success) {
        return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
      }

      const { rawText } = validation.data;

      // Log the summarize request
      const requestLogEntry = await createLogEntry('SUMMARIZE_TEXT', {
        textLength: rawText.length,
      });
      await logToAuditTrail(requestLogEntry);

      // Call the summarization API
      const response = await callSummarizationApi(rawText);

      // Log successful summarization
      const successLogEntry = await createLogEntry('SUMMARIZE_TEXT_SUCCESS', {
        originalLength: rawText.length,
        summaryLength: response.data.summary?.length || 0,
      });
      await logToAuditTrail(successLogEntry);

      // Return the summary
      return NextResponse.json(response.data);
    } catch (error) {
      return handleError(error, 'SUMMARIZE_TEXT', 'generate summary');
    }
  }),
  '/api/summarize',
  RateLimitPresets.AI_SERVICE
);

// Approve summary endpoint with rate limiting
export const PUT = withRateLimit(
  withErrorHandling(async (request: Request) => {
    // Check authentication
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required to approve summary');
    }

    try {
      const body = await request.json();

      // Validate and sanitize input using Zod schema
      const validation = validateAndSanitize(ApprovalRequestSchema, body);
      if (!validation.success) {
        return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
      }

      const { summary } = validation.data;

      // Log the approve summary request
      const requestLogEntry = await createLogEntry('APPROVE_SUMMARY', {
        summaryLength: summary.length,
      });
      await logToAuditTrail(requestLogEntry);

      // Call the approval API
      const response = await callApprovalApi(summary);

      // Log successful approval
      const successLogEntry = await createLogEntry('APPROVE_SUMMARY_SUCCESS');
      await logToAuditTrail(successLogEntry);

      // Return the approval result
      return NextResponse.json(response.data);
    } catch (error) {
      return handleError(error, 'APPROVE_SUMMARY', 'approve summary');
    }
  }),
  '/api/summarize/approve',
  RateLimitPresets.AI_SERVICE
);
