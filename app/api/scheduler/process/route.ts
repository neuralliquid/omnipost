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
    // Verify cron secret - mandatory in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, CRON_SECRET must be configured
    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      console.error('[Scheduler] CRON_SECRET not configured in production');
      return NextResponse.json(
        { error: 'Server misconfiguration: CRON_SECRET required' },
        { status: 500 }
      );
    }

    // Validate authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.log('[Scheduler] Process results:', summary);

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
