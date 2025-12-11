/**
 * Scheduler Stats Route
 * GET - Get scheduler statistics
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import type { JobStatus } from '@/lib/scheduler/types';

// Define all possible job statuses
const JOB_STATUSES: JobStatus[] = [
  'pending',
  'scheduled',
  'processing',
  'published',
  'failed',
  'dead',
  'cancelled',
];

/**
 * GET /api/scheduler/stats
 * Get scheduler statistics (user-scoped)
 * Returns job counts by status and timestamp
 */
export async function GET() {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const scheduler = getScheduler();

    // Get all jobs and filter by user
    const allJobs = await scheduler.getAllJobs();
    const userJobs = allJobs.filter(job => job.createdBy === currentUserId);

    // Calculate user-specific stats dynamically from JobStatus enum
    const userStats: Record<string, number> = {
      total: userJobs.length,
    };

    // Build status counts from enum to stay in sync with scheduler types
    for (const status of JOB_STATUSES) {
      userStats[status] = userJobs.filter(j => j.status === status).length;
    }

    return NextResponse.json({
      stats: userStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
