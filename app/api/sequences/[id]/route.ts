/**
 * Single Sequence API Routes
 * GET - Get sequence by ID
 * PATCH - Update sequence
 * DELETE - Delete sequence
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { sequencesClient } from '@/lib/data/sequences';
import type { SequenceStatus } from '@/types/sequence';

// Valid status values
const VALID_STATUSES: SequenceStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sequences/[id]
 * Get a sequence by ID
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const sequence = await sequencesClient.getSequence(id);
    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    return NextResponse.json({ sequence });
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 });
  }
}

/**
 * PATCH /api/sequences/[id]
 * Update a sequence
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if sequence exists
    const existingSequence = await sequencesClient.getSequence(id);
    if (!existingSequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
    }

    // Cannot activate a sequence without steps
    if (body.status === 'active' && existingSequence.steps.length === 0) {
      return NextResponse.json({
        error: 'Cannot activate a sequence without steps'
      }, { status: 400 });
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
  } catch (error) {
    console.error('Error updating sequence:', error);
    const message = error instanceof Error ? error.message : 'Failed to update sequence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/sequences/[id]
 * Delete a sequence
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if sequence exists
    const existingSequence = await sequencesClient.getSequence(id);
    if (!existingSequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Check if sequence is active
    if (existingSequence.status === 'active') {
      return NextResponse.json({
        error: 'Cannot delete an active sequence. Pause or complete it first.'
      }, { status: 400 });
    }

    const success = await sequencesClient.deleteSequence(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Sequence deleted' });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 });
  }
}
