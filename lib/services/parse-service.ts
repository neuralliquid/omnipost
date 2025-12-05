/**
 * Parse Service
 * Core business logic for text parsing operations
 */

import axios from 'axios';
import featureFlags from '@/lib/featureFlags';

// Helper function to get API endpoints with fallbacks
const getApiEndpoints = () => {
  return {
    deepseek: process.env.DEEPSEEK_API_ENDPOINT,
    openai: process.env.OPENAI_API_ENDPOINT,
    azure: process.env.AZURE_CONTENT_API_ENDPOINT,
  };
};

// Validate environment variables
function validateEnvironmentVariables(): boolean {
  const requiredVars = [
    'DEEPSEEK_API_ENDPOINT',
    'OPENAI_API_ENDPOINT',
    'AZURE_CONTENT_API_ENDPOINT',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  return true;
}

// Helper to validate all required feature flags
function validateFeatureFlags(): string | null {
  const requiredFlags = [
    { flag: featureFlags.textParser?.enabled, name: 'Text parser' },
    { flag: featureFlags.trigger?.cron?.enabled, name: 'CRON trigger' },
    { flag: featureFlags.trigger?.rss?.enabled, name: 'RSS trigger' },
    { flag: featureFlags.scraping?.enabled, name: 'Scraping' },
    { flag: featureFlags.storage?.notion?.enabled, name: 'Notion storage' },
    { flag: featureFlags.writing?.openai?.enabled, name: 'OpenAI writing' },
    { flag: featureFlags.distribution?.telegram?.enabled, name: 'Telegram distribution' },
  ];

  for (const { flag, name } of requiredFlags) {
    if (!flag) {
      return `${name} feature is disabled`;
    }
  }

  return null;
}

/**
 * Validate JSON input
 */
function validateJson(input: string): object | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export interface ParseServiceResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

/**
 * Parse text content using the configured AI service
 * @param rawInput - The raw text input to parse
 * @returns ParseServiceResult with the parsed data or error
 */
export async function parseText(rawInput: string): Promise<ParseServiceResult> {
  // Check feature flags
  const featureFlagError = validateFeatureFlags();
  if (featureFlagError) {
    return {
      success: false,
      error: featureFlagError,
      statusCode: 403,
    };
  }

  // Validate environment variables
  if (!validateEnvironmentVariables()) {
    return {
      success: false,
      error: 'Text parser service is not properly configured',
      statusCode: 500,
    };
  }

  // Parse and validate the JSON input
  const parsedData = validateJson(rawInput);
  if (!parsedData) {
    return {
      success: false,
      error: 'Invalid JSON input',
      statusCode: 400,
    };
  }

  // Get API endpoints
  const apiEndpoints = getApiEndpoints();

  // Determine which implementation to use based on feature flags
  const implementation = featureFlags.textParser.implementation;
  const endpointMap: Record<'deepseek' | 'openai' | 'azure', string | undefined> = {
    deepseek: apiEndpoints.deepseek,
    openai: apiEndpoints.openai,
    azure: apiEndpoints.azure,
  };

  const endpoint = endpointMap[implementation as keyof typeof endpointMap];
  if (!endpoint) {
    return {
      success: false,
      error: 'Invalid text parser implementation',
      statusCode: 400,
    };
  }

  const response = await axios.post(endpoint, { data: parsedData });

  return {
    success: true,
    data: response.data,
  };
}
