/**
 * Scheduler Stats Route
 * GET - Get scheduler statistics
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';

/**
 * GET /api/scheduler/stats
 * Get scheduler statistics and rate limit status (user-scoped)
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
    const allStats = await scheduler.getStats();
    
    // Get all jobs and filter by user
    const allJobs = await scheduler.getAllJobs();
    const userJobs = allJobs.filter(job => job.createdBy === currentUserId);
    
    // Calculate user-specific stats
    const userStats = {
      total: userJobs.length,
      pending: userJobs.filter(j => j.status === 'pending').length,
      processing: userJobs.filter(j => j.status === 'processing').length,
      published: userJobs.filter(j => j.status === 'published').length,
      failed: userJobs.filter(j => j.status === 'failed').length,
      dead: userJobs.filter(j => j.status === 'dead').length,
      cancelled: userJobs.filter(j => j.status === 'cancelled').length,
    };

    return NextResponse.json({
      stats: userStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
