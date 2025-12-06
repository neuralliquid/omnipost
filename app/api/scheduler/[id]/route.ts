/**
 * Individual Job API Routes
 * GET - Get job details
 * DELETE - Cancel a job
 * PATCH - Update job (reschedule)
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/scheduler/[id]
 * Get job details (user-scoped)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { id } = await params;
    const scheduler = getScheduler();
    const job = await scheduler.getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (job.createdBy !== currentUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * DELETE /api/scheduler/[id]
 * Cancel a scheduled job (user-scoped)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { id } = await params;
    const scheduler = getScheduler();
    const job = await scheduler.getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (job.createdBy !== currentUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const cancelled = await scheduler.cancel(id);

    if (!cancelled) {
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: id,
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
  }
}

/**
 * Verify job ownership
 */
async function verifyJobOwnership(
  scheduler: ReturnType<typeof getScheduler>,
  jobId: string,
  userId: string
): Promise<{ error?: NextResponse; job?: Awaited<ReturnType<typeof scheduler.getJob>> }> {
  const job = await scheduler.getJob(jobId);

  if (!job) {
    return { error: NextResponse.json({ error: 'Job not found' }, { status: 404 }) };
  }

  if (job.createdBy !== userId) {
    return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  return { job };
}

/**
 * Handle retry action
 */
async function handleRetryAction(
  scheduler: ReturnType<typeof getScheduler>,
  jobId: string
): Promise<NextResponse> {
  const job = await scheduler.retry(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: 'Job queued for retry',
    job,
  });
}

/**
 * Validate and parse scheduled time
 */
function validateScheduledTime(scheduledTimeStr: string): { error?: NextResponse; date?: Date } {
  const scheduledTime = new Date(scheduledTimeStr);

  if (Number.isNaN(scheduledTime.getTime())) {
    return { error: NextResponse.json({ error: 'Invalid scheduledTime format' }, { status: 400 }) };
  }

  if (scheduledTime.getTime() <= Date.now()) {
    return {
      error: NextResponse.json({ error: 'scheduledTime must be in the future' }, { status: 400 }),
    };
  }

  return { date: scheduledTime };
}

/**
 * Handle reschedule action
 */
async function handleRescheduleAction(
  scheduler: ReturnType<typeof getScheduler>,
  jobId: string,
  scheduledTimeStr: string
): Promise<NextResponse> {
  const validation = validateScheduledTime(scheduledTimeStr);
  if (validation.error) {
    return validation.error;
  }

  const job = await scheduler.reschedule(jobId, validation.date!.toISOString());

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: 'Job rescheduled successfully',
    job,
  });
}

/**
 * PATCH /api/scheduler/[id]
 * Update job (reschedule or retry) - user-scoped
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const scheduler = getScheduler();

    // Verify job exists and user owns it
    const ownership = await verifyJobOwnership(scheduler, id, currentUserId);
    if (ownership.error) {
      return ownership.error;
    }

    // Handle retry action
    if (body.action === 'retry') {
      return handleRetryAction(scheduler, id);
    }

    // Handle reschedule
    if (body.scheduledTime) {
      return handleRescheduleAction(scheduler, id, body.scheduledTime);
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating job:', error);
    const message = error instanceof Error ? error.message : 'Failed to update job';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
