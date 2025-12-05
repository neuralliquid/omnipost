/**
 * Image Service
 * Core business logic for image generation operations
 */

import featureFlags from '@/lib/featureFlags';
import { HuggingFaceClient } from '@/lib/clients/huggingface';
import { azureAIClient } from '@/lib/clients/azure-ai-foundry';

// Initialize the HuggingFace client
const huggingFaceClient = new HuggingFaceClient();

export interface ImageServiceResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

/**
 * Generate an image using the configured AI service
 * @param prompt - The prompt to generate an image from
 * @returns ImageServiceResult with the generated image or error
 */
export async function generateImage(prompt: string): Promise<ImageServiceResult> {
  // Check if image generation feature is enabled (using proper object access)
  if (!featureFlags.imageGeneration?.enabled) {
    return {
      success: false,
      error: 'Image generation feature is disabled',
      statusCode: 403,
    };
  }

  // Determine which implementation to use based on feature flags
  const implementation = featureFlags.imageGeneration?.implementation || 'huggingface';

  try {
    if (implementation === 'azure-foundry' || implementation === 'dall-e') {
      // Use Azure AI Foundry for image generation
      if (!azureAIClient.isConfigured()) {
        return {
          success: false,
          error: 'Azure AI Foundry is not configured',
          statusCode: 500,
        };
      }

      const response = await azureAIClient.generateImage(prompt);
      return {
        success: true,
        data: {
          url: response.data[0]?.url,
          revisedPrompt: response.data[0]?.revisedPrompt,
        },
      };
    }

    // Default to HuggingFace
    const response = await huggingFaceClient.generateImage(prompt);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate image';
    return {
      success: false,
      error: message,
      statusCode: 500,
    };
  }
}

/**
 * Review an image (approve, reject, or regenerate)
 * @param image - The image data to review
 * @param action - The action to perform: 'approve', 'reject', or 'regenerate'
 * @returns ImageServiceResult with the review result or error
 */
export async function reviewImage(
  image: Record<string, unknown>,
  action: 'approve' | 'reject' | 'regenerate'
): Promise<ImageServiceResult> {
  try {
    if (action === 'approve') {
      const response = await huggingFaceClient.approveImage(image);
      return {
        success: true,
        data: response,
      };
    }

    if (action === 'reject') {
      const response = await huggingFaceClient.rejectImage(image);
      return {
        success: true,
        data: response,
      };
    }

    if (action === 'regenerate') {
      if (!image.context || typeof image.context !== 'string') {
        return {
          success: false,
          error: 'Context is required for regeneration',
          statusCode: 400,
        };
      }
      const response = await huggingFaceClient.regenerateImage(image.context);
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: 'Invalid action',
      statusCode: 400,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review image';
    return {
      success: false,
      error: message,
      statusCode: 500,
    };
  }
}
