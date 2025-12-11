import { NextResponse } from 'next/server';
import featureFlags from '../../../lib/featureFlags';
import { createLogEntry, logToAuditTrail } from '../_utils/audit';
import { isAuthenticated } from '../_utils/auth';
import { Errors, withErrorHandling } from '../_utils/errors';
import { imageContextSchema, validateAndSanitize } from '../_utils/sanitize';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';
import { HuggingFaceClient } from '../../../lib/clients/huggingface';

// Initialize the HuggingFace client
const huggingFaceClient = new HuggingFaceClient();

// Generate image endpoint with rate limiting to prevent AI API abuse
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    try {
      // Check authentication
      if (!(await isAuthenticated())) {
        return Errors.unauthorized('Authentication required to generate images');
      }

      // Check if image generation feature is enabled
      if (!featureFlags.imageGeneration) {
        return Errors.forbidden('Image generation feature is disabled');
      }

      const body = await request.json();

      // Validate and sanitize input using Zod schema
      const validation = validateAndSanitize(imageContextSchema, body);
      if (!validation.success) {
        return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
      }

      const { context } = validation.data;

      // Log the image generation request
      const logEntry = await createLogEntry('GENERATE_IMAGE', { contextLength: context.length });
      await logToAuditTrail(logEntry);

      // Generate the image
      const response = await huggingFaceClient.generateImage(context);

      // Return the generated image data
      return NextResponse.json(response.data);
    } catch (error) {
      console.error('Error generating image:', error);
      return Errors.internalServerError('Failed to generate image');
    }
  }),
  '/api/images',
  RateLimitPresets.AI_SERVICE
);

// Review image endpoint
export const PUT = withErrorHandling(async (request: Request) => {
  try {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required to review images');
    }

    const body = await request.json();
    const { image, action } = body;

    // Validate image and action
    if (!image || typeof image !== 'object') {
      return Errors.badRequest('Invalid image data provided');
    }

    if (!action || !['approve', 'reject', 'regenerate'].includes(action)) {
      return Errors.badRequest('Invalid action. Must be one of: approve, reject, regenerate');
    }

    // Log the image review action
    const logEntry = await createLogEntry('REVIEW_IMAGE', { action });
    await logToAuditTrail(logEntry);

    let response;

    // Perform the requested action
    if (action === 'approve') {
      response = await huggingFaceClient.approveImage(image);
    } else if (action === 'reject') {
      response = await huggingFaceClient.rejectImage(image);
    } else if (action === 'regenerate') {
      if (!image.context) {
        return Errors.badRequest('Context is required for regeneration');
      }
      response = await huggingFaceClient.regenerateImage(image.context);
      // For regenerate, return the same format as the POST endpoint
      return NextResponse.json(response.data);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reviewing image:', error);
    return Errors.internalServerError('Failed to process image review');
  }
});
