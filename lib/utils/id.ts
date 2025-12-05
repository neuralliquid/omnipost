/**
 * Secure ID Generation Utilities
 * Uses crypto.randomUUID() for cryptographically secure random ID generation
 */

// Import crypto for Node.js environment
import crypto from 'node:crypto';

/**
 * Generate a cryptographically secure UUID
 * Works in both Node.js and browser environments
 */
function getRandomUUID(): string {
  // In browser, globalThis.crypto is available
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // In Node.js, use the imported crypto module
  return crypto.randomUUID();
}

/**
 * Generate a cryptographically secure unique ID with a prefix
 * @param prefix - Optional prefix for the ID (e.g., 'campaign', 'content', 'job')
 * @returns A unique ID string in the format: {prefix}_{timestamp}_{random}
 */
export function generateSecureId(prefix?: string): string {
  const timestamp = Date.now();
  // Use randomUUID() for secure randomness, take first 9 chars
  const random = getRandomUUID().replace(/-/g, '').substring(0, 9);

  if (prefix) {
    return `${prefix}_${timestamp}_${random}`;
  }
  return `${timestamp}_${random}`;
}

/**
 * Generate a campaign ID
 */
export function generateCampaignId(): string {
  return generateSecureId('campaign');
}

/**
 * Generate a content ID
 */
export function generateContentId(): string {
  return generateSecureId('content');
}

/**
 * Generate a job ID
 */
export function generateJobId(): string {
  return generateSecureId('job');
}

/**
 * Generate a post ID
 */
export function generatePostId(): string {
  return generateSecureId('post');
}

/**
 * Generate a platform-specific post ID
 * @param platformId - The platform identifier
 */
export function generatePlatformPostId(platformId: string): string {
  return generateSecureId(platformId);
}
