/**
 * Single Sequence API Routes
 * GET - Get sequence by ID
 * PATCH - Update sequence
 * DELETE - Delete sequence
 */

import { NextResponse } from 'next/server';
import { sequencesClient } from '@/lib/data/sequences';
import { VALID_SEQUENCE_STATUSES } from '@/app/api/_utils/constants';
import {
  requireAuth,
  validateEnumField,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sequences/[id]
 * Get a sequence by ID
 */
export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const sequence = await sequencesClient.getSequence(id);
  if (!sequence) {
    return ErrorResponses.notFound('Sequence');
  }

  return NextResponse.json({ sequence });
});

/**
 * PATCH /api/sequences/[id]
 * Update a sequence
 */
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // Check if sequence exists
  const existingSequence = await sequencesClient.getSequence(id);
  if (!existingSequence) {
    return ErrorResponses.notFound('Sequence');
  }

  const body = await request.json();

  // Validate status if provided
  if (body.status) {
    const statusError = validateEnumField(body.status, VALID_SEQUENCE_STATUSES, 'status');
    if (statusError) return statusError;
  }

  // Cannot activate a sequence without steps
  if (body.status === 'active' && existingSequence.steps.length === 0) {
    return ErrorResponses.badRequest('Cannot activate a sequence without steps');
  }

  const sequence = await sequencesClient.updateSequence(id, {
    name: body.name?.trim(),
    description: body.description?.trim(),
    status: body.status,
    schedule: body.schedule,
    stopOnReply: body.stopOnReply,
    stopOnBounce: body.stopOnBounce,
    stopOnUnsubscribe: body.stopOnUnsubscribe,
    senderName: body.senderName,
    senderEmail: body.senderEmail,
    tags: body.tags,
  });

  return NextResponse.json({ sequence });
});

/**
 * DELETE /api/sequences/[id]
 * Delete a sequence
 */
export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // Check if sequence exists
  const existingSequence = await sequencesClient.getSequence(id);
  if (!existingSequence) {
    return ErrorResponses.notFound('Sequence');
  }

  // Check if sequence is active
  if (existingSequence.status === 'active') {
    return ErrorResponses.badRequest(
      'Cannot delete an active sequence. Pause or complete it first.'
    );
  }

  const success = await sequencesClient.deleteSequence(id);
  if (!success) {
    return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Sequence deleted' });
});
