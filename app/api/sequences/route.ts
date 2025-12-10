/**
 * Sequences API Routes
 * GET - List sequences
 * POST - Create new sequence
 */

import { NextResponse } from 'next/server';
import { sequencesClient } from '@/lib/data/sequences';
import {
  VALID_SEQUENCE_STATUSES,
  VALID_SEQUENCE_STEP_TYPES,
} from '@/app/api/_utils/constants';
import {
  requireAuth,
  requireAuthWithUserId,
  validateRequiredFields,
  validateEnumField,
  validateArrayField,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';

/**
 * GET /api/sequences
 * List sequences with optional filters
 */
export const GET = withErrorHandling(async (request: Request) => {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);

  // Validate status if provided
  if (status) {
    const statusError = validateEnumField(status, VALID_SEQUENCE_STATUSES, 'status');
    if (statusError) return statusError;
  }

  const result = await sequencesClient.querySequences({
    status: status || undefined,
    page,
    pageSize: Math.min(pageSize, 50),
  });

  return NextResponse.json({
    sequences: result.sequences,
    pagination: result.pagination,
  });
});

/**
 * POST /api/sequences
 * Create a new sequence
 */
export const POST = withErrorHandling(async (request: Request) => {
  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate required fields
  const requiredError = validateRequiredFields(body, ['name', 'steps']);
  if (requiredError) return requiredError;

  // Validate steps array
  const arrayError = validateArrayField(body.steps, 'steps', 1);
  if (arrayError) return arrayError;

  // Validate each step
  for (let i = 0; i < body.steps.length; i++) {
    const step = body.steps[i];

    // Validate step type
    if (!step.type || !VALID_SEQUENCE_STEP_TYPES.includes(step.type)) {
      return ErrorResponses.badRequest(
        `Step ${i + 1}: type must be one of: ${VALID_SEQUENCE_STEP_TYPES.join(', ')}`
      );
    }

    // Validate step name
    if (!step.name?.trim()) {
      return ErrorResponses.badRequest(`Step ${i + 1}: name is required`);
    }

    // Validate wait config
    if (step.type === 'wait' && !step.waitConfig) {
      return ErrorResponses.badRequest(
        `Step ${i + 1}: waitConfig is required for wait steps`
      );
    }

    // Assign order if not provided
    if (step.order === undefined) {
      step.order = i + 1;
    }

    // Default enabled to true
    if (step.enabled === undefined) {
      step.enabled = true;
    }
  }

  const sequence = await sequencesClient.createSequence(
    {
      name: body.name.trim(),
      description: body.description?.trim(),
      steps: body.steps,
      schedule: body.schedule,
      stopOnReply: body.stopOnReply ?? true,
      stopOnBounce: body.stopOnBounce ?? true,
      stopOnUnsubscribe: body.stopOnUnsubscribe ?? true,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      tags: body.tags,
    },
    authResult.userId
  );

  return NextResponse.json({ sequence }, { status: 201 });
});
