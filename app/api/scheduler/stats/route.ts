/**
 * Scheduler Stats Route
 * GET - Get scheduler statistics
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';

/**
 * GET /api/scheduler/stats
 * Get scheduler statistics and rate limit status
 */
export async function GET() {
  try {
    const scheduler = getScheduler();
    const stats = await scheduler.getStats();

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
