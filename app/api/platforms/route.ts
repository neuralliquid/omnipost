import { NextResponse } from 'next/server';
import { platforms } from '../../../config/platforms';
import { withErrorHandling, Errors } from '../_utils/errors';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { isAuthenticated } from '../_utils/auth';
import featureFlags from '../../../utils/featureFlags';

/**
 * Validates user authentication
 * @returns Error response if not authenticated, null otherwise
 */
async function validateAuth() {
  if (!(await isAuthenticated())) {
    return Errors.unauthorized('Authentication required');
  }
  return null;
}

/**
 * Retrieves platforms data
 * @returns Array of platform objects
 */
async function getPlatformsData() {
  return platforms;
}

/**
 * Logs platform list access to audit trail
 */
async function logPlatformsAccess() {
  const logEntry = await createLogEntry('GET_PLATFORMS_LIST');
  await logToAuditTrail(logEntry);
}

/**
 * GET handler for platforms endpoint
 */
export const GET = withErrorHandling(async () => {
  // Check authentication
  const authError = await validateAuth();
  if (authError) return authError;

  // Log the access to platforms list
  await logPlatformsAccess();

  // Return platforms list
  return NextResponse.json(platforms);
});

export const POST = withErrorHandling(async (request: Request) => {
  // Check feature flags
  if (!featureFlags.trigger.cron.enabled) {
    return Errors.forbidden('CRON trigger feature is disabled');
  }

  if (!featureFlags.trigger.rss.enabled) {
    return Errors.forbidden('RSS trigger feature is disabled');
  }

  if (!featureFlags.scraping.enabled) {
    return Errors.forbidden('Scraping feature is disabled');
  }

  if (!featureFlags.storage.notion.enabled) {
    return Errors.forbidden('Notion storage feature is disabled');
  }

  if (!featureFlags.writing.openai.enabled) {
    return Errors.forbidden('OpenAI writing feature is disabled');
  }

  if (!featureFlags.distribution.telegram.enabled) {
    return Errors.forbidden('Telegram distribution feature is disabled');
  }

  // Handle the POST request logic here
  // For now, just return a success response
  // TODO: Implement platform creation/update functionality. This should handle:
  // - Validating the platform data
  // - Storing the platform in the database
  // - Returning the created/updated platform
  return NextResponse.json({ message: 'POST request handled successfully' });
});
