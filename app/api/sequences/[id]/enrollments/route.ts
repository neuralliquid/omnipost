/**
 * Sequence Enrollments API Routes
 * GET - List enrollments for a sequence
 * POST - Enroll leads in a sequence
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { sequencesClient } from '@/lib/data/sequences';
import type { SequenceEnrollment } from '@/types/sequence';

// Valid enrollment statuses
const VALID_STATUSES: SequenceEnrollment['status'][] = [
  'active',
  'paused',
  'completed',
  'replied',
  'bounced',
  'unsubscribed',
  'stopped',
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sequences/[id]/enrollments
 * List enrollments for a sequence
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if sequence exists
    const sequence = await sequencesClient.getSequence(id);
    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as SequenceEnrollment['status'] | null;
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result = await sequencesClient.queryEnrollments({
      sequenceId: id,
      status: status || undefined,
      page,
      pageSize: Math.min(pageSize, 100),
    });

    return NextResponse.json({
      enrollments: result.enrollments,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

/**
 * Handle single lead enrollment
 */
async function handleSingleEnrollment(
  sequenceId: string,
  leadId: string,
  userId: string,
  startAt?: string
): Promise<NextResponse> {
  try {
    const enrollment = await sequencesClient.enrollLead(sequenceId, leadId, userId, startAt);
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enroll lead';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Handle bulk lead enrollment
 */
async function handleBulkEnrollment(
  sequenceId: string,
  leadIds: string[],
  userId: string,
  startAt?: string,
  skipDuplicates: boolean = true
): Promise<NextResponse> {
  if (leadIds.length === 0) {
    return NextResponse.json({ error: 'leadIds must not be empty' }, { status: 400 });
  }

  if (leadIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 leads per bulk enrollment' }, { status: 400 });
  }

  const result = await sequencesClient.bulkEnroll(
    {
      sequenceId,
      leadIds,
      startAt,
      skipDuplicates,
    },
    userId
  );

  return NextResponse.json(
    {
      enrolled: result.enrolled,
      skipped: result.skipped,
      errors: result.errors,
    },
    { status: 201 }
  );
}

/**
 * POST /api/sequences/[id]/enrollments
 * Enroll leads in a sequence
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { id } = await params;

    // Check if sequence exists
    const sequence = await sequencesClient.getSequence(id);
    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Check if sequence is active or draft
    if (!['active', 'draft'].includes(sequence.status)) {
      return NextResponse.json(
        {
          error: `Cannot enroll leads in a ${sequence.status} sequence`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Single lead enrollment
    if (body.leadId) {
      return await handleSingleEnrollment(id, body.leadId, currentUserId, body.startAt);
    }

    // Bulk enrollment
    if (body.leadIds && Array.isArray(body.leadIds)) {
      return await handleBulkEnrollment(
        id,
        body.leadIds,
        currentUserId,
        body.startAt,
        body.skipDuplicates ?? true
      );
    }

    return NextResponse.json(
      {
        error: 'Either leadId or leadIds is required',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error enrolling leads:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
