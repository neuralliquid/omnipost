/**
 * Individual Job API Routes
 * GET - Get job details
 * DELETE - Cancel a job
 * PATCH - Update job (reschedule)
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/scheduler/[id]
 * Get job details
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scheduler = getScheduler();
    const job = await scheduler.getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * DELETE /api/scheduler/[id]
 * Cancel a scheduled job
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scheduler = getScheduler();
    const cancelled = await scheduler.cancel(id);

    if (!cancelled) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: id,
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel job';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PATCH /api/scheduler/[id]
 * Update job (reschedule or retry)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const scheduler = getScheduler();

    // Handle retry action
    if (body.action === 'retry') {
      const job = await scheduler.retry(id);

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Job queued for retry',
        job,
      });
    }

    // Handle reschedule
    if (body.scheduledTime) {
      const scheduledTime = new Date(body.scheduledTime);
      if (Number.isNaN(scheduledTime.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledTime format' }, { status: 400 });
      }

      const job = await scheduler.reschedule(id, body.scheduledTime);

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Job rescheduled successfully',
        job,
      });
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating job:', error);
    const message = error instanceof Error ? error.message : 'Failed to update job';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
