/**
 * Scheduler Process Route
 * POST - Trigger processing of due jobs (for cron/manual trigger)
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';

/**
 * POST /api/scheduler/process
 * Process due jobs
 *
 * This endpoint is designed to be called by:
 * - Vercel Cron (every minute)
 * - Manual trigger for testing
 * - External scheduler service
 */
export async function POST(request: Request) {
  try {
    // Optional: Verify cron secret for production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production, require authentication
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const scheduler = getScheduler();
    const results = await scheduler.processDueJobs();

    const summary = {
      processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failure').length,
      timestamp: new Date().toISOString(),
    };

    // Log for monitoring
    console.warn('[Scheduler] Process results:', summary);

    return NextResponse.json({
      message: `Processed ${summary.processed} jobs`,
      ...summary,
      results,
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json({ error: 'Failed to process jobs' }, { status: 500 });
  }
}

/**
 * GET /api/scheduler/process
 * Get processing status (for health checks)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Scheduler process endpoint ready',
    timestamp: new Date().toISOString(),
  });
}
