/**
 * Sequences API Routes
 * GET - List sequences
 * POST - Create new sequence
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { sequencesClient } from '@/lib/data/sequences';
import type { SequenceStatus } from '@/types/sequence';

// Valid status values
const VALID_STATUSES: SequenceStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];

/**
 * GET /api/sequences
 * List sequences with optional filters
 */
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as SequenceStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
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
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 });
  }
}

/**
 * POST /api/sequences
 * Create a new sequence
 */
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json({ error: 'steps must be a non-empty array' }, { status: 400 });
    }

    // Validate each step
    const validStepTypes = [
      'email', 'linkedin_message', 'linkedin_connection', 'linkedin_view_profile',
      'linkedin_endorse', 'sms', 'call', 'task', 'wait', 'condition'
    ];

    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];

      if (!step.type || !validStepTypes.includes(step.type)) {
        return NextResponse.json({
          error: `Step ${i + 1}: type must be one of: ${validStepTypes.join(', ')}`
        }, { status: 400 });
      }

      if (!step.name?.trim()) {
        return NextResponse.json({
          error: `Step ${i + 1}: name is required`
        }, { status: 400 });
      }

      // Validate wait config
      if (step.type === 'wait' && !step.waitConfig) {
        return NextResponse.json({
          error: `Step ${i + 1}: waitConfig is required for wait steps`
        }, { status: 400 });
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

    const sequence = await sequencesClient.createSequence({
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
    }, currentUserId);

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    console.error('Error creating sequence:', error);
    const message = error instanceof Error ? error.message : 'Failed to create sequence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
