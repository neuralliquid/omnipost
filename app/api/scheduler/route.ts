/**
 * Scheduler API Routes
 * GET - List scheduled jobs
 * POST - Create new scheduled job
 */

import { NextResponse } from 'next/server';
import { getScheduler, CreateJobInput, JobStatus } from '@/lib/scheduler';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';

/**
 * GET /api/scheduler
 * List scheduled jobs with optional filters (user-scoped)
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as JobStatus | null;
    const campaignId = searchParams.get('campaignId');
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);

    const scheduler = getScheduler();

    let jobs;
    if (campaignId) {
      jobs = await scheduler.getJobsByCampaign(campaignId);
    } else if (status) {
      jobs = await scheduler.getJobsByStatus(status, limit);
    } else {
      jobs = await scheduler.getAllJobs();
      jobs = jobs.slice(0, limit);
    }

    // Filter jobs by current user
    const userJobs = jobs.filter(job => job.createdBy === currentUserId);

    return NextResponse.json({
      jobs: userJobs,
      count: userJobs.length,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * POST /api/scheduler
 * Create a new scheduled job (user-scoped)
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const required = ['type', 'contentId', 'platformId', 'content', 'scheduledTime'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate content has text
    if (!body.content.text) {
      return NextResponse.json({ error: 'Content must include text' }, { status: 400 });
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(body.scheduledTime);
    if (Number.isNaN(scheduledTime.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledTime format' }, { status: 400 });
    }

    const input: CreateJobInput = {
      type: body.type,
      campaignId: body.campaignId,
      contentId: body.contentId,
      platformId: body.platformId,
      content: body.content,
      scheduledTime: body.scheduledTime,
      timezone: body.timezone,
      maxAttempts: body.maxAttempts,
      createdBy: currentUserId, // Use authenticated user ID
    };

    const scheduler = getScheduler();
    const job = await scheduler.schedule(input);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    const message = error instanceof Error ? error.message : 'Failed to create job';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
