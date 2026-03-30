/**
 * Feature flags configuration
 * This file manages feature flags for the application
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// Define specific feature flag types
export interface TextParserFeatureFlag {
  enabled: boolean;
  implementation: 'deepseek' | 'openai' | 'azure' | 'azure-foundry';
}

export interface ImageGenerationFeatureFlag {
  enabled: boolean;
  implementation: 'huggingface' | 'azure-foundry' | 'dall-e';
}

export interface SummarizationFeatureFlag {
  enabled: boolean;
  implementation: 'huggingface' | 'azure-foundry' | 'openai';
}

export interface FeatureFlag {
  enabled: boolean;
  implementation?: string;
}

// CRM and Prospecting Feature Flags
export interface LeadManagementFeatureFlag {
  enabled: boolean;
  scoring: boolean;
  tagging: boolean;
  lists: boolean;
}

export interface OutreachSequencesFeatureFlag {
  enabled: boolean;
  emailAutomation: boolean;
  linkedinAutomation: boolean;
  maxSequences: number;
  maxStepsPerSequence: number;
}

export interface SurveyFormsFeatureFlag {
  enabled: boolean;
  leadCapture: boolean;
  nps: boolean;
  maxFormsPerUser: number;
}

export interface LinkedInProspectingFeatureFlag {
  enabled: boolean;
  searchEnabled: boolean;
  importEnabled: boolean;
  automationEnabled: boolean;
}

export interface CrmDashboardFeatureFlag {
  enabled: boolean;
  analytics: boolean;
  pipelineView: boolean;
}

export interface AIGatewayFeatureFlag {
  enabled: boolean;
  fallbackToDirectCalls: boolean;
}

// Define the base feature flags interface without index signature
interface BaseFeatureFlags {
  textParser: TextParserFeatureFlag;
  imageGeneration: ImageGenerationFeatureFlag;
  summarization: SummarizationFeatureFlag;
  platformConnectors: boolean;
  multiPlatformPublishing: boolean;
  notificationSystem: boolean;
  feedbackMechanism: boolean;
  airtableIntegration: boolean;
  // CRM and Prospecting
  leadManagement: LeadManagementFeatureFlag;
  outreachSequences: OutreachSequencesFeatureFlag;
  surveyForms: SurveyFormsFeatureFlag;
  linkedinProspecting: LinkedInProspectingFeatureFlag;
  crmDashboard: CrmDashboardFeatureFlag;
  // AI Gateway (Sluice)
  aiGateway: AIGatewayFeatureFlag;
}

// Extend the base interface with an index signature for dynamic access
// Note: 'any' is intentionally used here to support dynamic nested feature flag structures
// (e.g., featureFlags.trigger.cron.enabled) without defining all possible nested types
export interface FeatureFlags extends BaseFeatureFlags {
  // biome-ignore lint/suspicious/noExplicitAny: Required for dynamic nested feature flag access
  [key: string]: boolean | TextParserFeatureFlag | any;
}
// Simple mutex implementation for synchronizing feature flag updates
class Mutex {
  private locked = false;
  private readonly waitQueue: Array<() => void> = [];

  async acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.locked) {
        this.waitQueue.push(resolve);
      } else {
        this.locked = true;
        resolve();
      }
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

// Create a mutex for feature flag updates
const mutex = new Mutex();

// Path for persisting feature flags (if in Node.js environment)
const featureFlagsPath =
  typeof process !== 'undefined' && process.cwd
    ? path.join(process.cwd(), 'data', 'feature-flags.json')
    : '';

/**
 * Validates that the feature flags path is safe and within expected bounds
 * Prevents path traversal by ensuring the path is within the data directory
 */
function isValidFeatureFlagsPath(filePath: string): boolean {
  if (!filePath) return false;

  try {
    const normalizedPath = path.normalize(filePath);
    const expectedDir = path.join(process.cwd(), 'data');
    const normalizedExpectedDir = path.normalize(expectedDir);

    // Ensure the path is within the data directory
    return (
      normalizedPath.startsWith(normalizedExpectedDir) &&
      normalizedPath.endsWith('feature-flags.json')
    );
  } catch {
    return false;
  }
}

// Default feature flags configuration
const featureFlags: FeatureFlags = {
  textParser: {
    enabled: true,
    implementation: 'openai',
  },
  imageGeneration: {
    enabled: true,
    implementation: 'huggingface',
  },
  summarization: {
    enabled: true,
    implementation: 'huggingface',
  },
  platformConnectors: true,
  multiPlatformPublishing: true,
  notificationSystem: true,
  feedbackMechanism: true,
  airtableIntegration: true,
  // CRM and Prospecting defaults
  leadManagement: {
    enabled: true,
    scoring: true,
    tagging: true,
    lists: true,
  },
  outreachSequences: {
    enabled: true,
    emailAutomation: true,
    linkedinAutomation: false,
    maxSequences: 10,
    maxStepsPerSequence: 20,
  },
  surveyForms: {
    enabled: true,
    leadCapture: true,
    nps: true,
    maxFormsPerUser: 50,
  },
  linkedinProspecting: {
    enabled: false,
    searchEnabled: false,
    importEnabled: true,
    automationEnabled: false,
  },
  crmDashboard: {
    enabled: true,
    analytics: true,
    pipelineView: true,
  },
  // AI Gateway (Sluice) - disabled by default, opt-in
  aiGateway: {
    enabled: false,
    fallbackToDirectCalls: true,
  },
};
/**
 * Save feature flags to localStorage (in browser) or file (in Node.js)
 * Uses atomic file operations and mutex to prevent race conditions
 */
export async function saveFeatureFlags(): Promise<void> {
  // Acquire the mutex to prevent concurrent updates
  await mutex.acquire();
  try {
    if (globalThis.window !== undefined) {
      // Browser environment
      localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
    } else if (featureFlagsPath && isValidFeatureFlagsPath(featureFlagsPath)) {
      // Node.js environment - validate path and use atomic file operations
      const dirPath = path.dirname(featureFlagsPath);

      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Create a temporary file with a unique name using crypto for secure randomness
      const tmpPath = path.join(
        os.tmpdir(),
        `feature-flags-${Date.now()}-${crypto.randomUUID()}.json`
      );

      // Write to temporary file first
      fs.writeFileSync(tmpPath, JSON.stringify(featureFlags, null, 2), 'utf8');

      // Atomically rename the temporary file to the target file
      // This ensures the write is atomic and prevents partial writes
      fs.renameSync(tmpPath, featureFlagsPath);
    }
  } finally {
    // Always release the mutex
    mutex.release();
  }
}

/**
 * Load feature flags from localStorage (in browser) or file (in Node.js)
 * @returns Current feature flags
 */
export function loadFeatureFlags(): FeatureFlags {
  try {
    if (globalThis.window !== undefined) {
      // Browser environment
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored feature flags:', e);
        }
      }
    } else if (featureFlagsPath && isValidFeatureFlagsPath(featureFlagsPath)) {
      // Node.js environment - validate and check if file exists before reading
      try {
        // Path has been validated by isValidFeatureFlagsPath() to prevent traversal
        // codacy-disable-next-line
        if (fs.existsSync(featureFlagsPath)) {
          const data = fs.readFileSync(featureFlagsPath, 'utf8');
          return { ...featureFlags, ...JSON.parse(data) };
        }
      } catch (e) {
        console.error('Failed to load feature flags from file:', e);
      }
    }
  } catch (e) {
    // Catch any unexpected errors (e.g., file system not available)
    console.error('Error in loadFeatureFlags:', e);
  }
  return featureFlags;
}

// Initialize by loading saved flags
try {
  const savedFlags = loadFeatureFlags();
  Object.assign(featureFlags, savedFlags);
} catch (e) {
  console.error('Error loading feature flags:', e);
}
// Export the default feature flags
export default featureFlags;
