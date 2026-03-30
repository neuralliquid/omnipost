/**
 * Analytics Events API
 *
 * Receives batched analytics events from the client-side tracker.
 * Validates event structure, logs to audit trail, and stores for analysis.
 *
 * POST /api/analytics/events
 * Body: { events: Array<{ name: string, properties: object }> }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Errors, withErrorHandling } from '../../_utils/errors';
import { isAuthenticated } from '../../_utils/auth';
import { withRateLimit, RateLimitPresets } from '../../_utils/rateLimit';
import { logToAuditTrail } from '../../_utils/audit';

// ── Validation Schema ────────────────────────────────────────────────────

const eventSchema = z.object({
  name: z.string().min(1).max(100),
  properties: z.record(z.unknown()).default({}),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

// ── In-Memory Event Store (Alpha) ────────────────────────────────────────

interface StoredEvent {
  name: string;
  properties: Record<string, unknown>;
  receivedAt: string;
  ip?: string;
}

const eventStore: StoredEvent[] = [];
const MAX_STORED_EVENTS = 50_000;

// ── Route Handlers ───────────────────────────────────────────────────────

export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    const body = await request.json();
    const validation = batchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid event batch', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { events } = validation.data;
    const receivedAt = new Date().toISOString();

    // Store events (bounded)
    for (const event of events) {
      if (eventStore.length >= MAX_STORED_EVENTS) {
        // Remove oldest 10% to make room
        eventStore.splice(0, Math.floor(MAX_STORED_EVENTS * 0.1));
      }

      eventStore.push({
        name: event.name,
        properties: event.properties,
        receivedAt,
      });
    }

    // Audit log for significant events
    const significantEvents = events.filter(e =>
      ['signup_completed', 'platform_connected', 'post_published', 'payment_completed'].includes(e.name)
    );

    if (significantEvents.length > 0) {
      await logToAuditTrail({
        action: 'ANALYTICS_SIGNIFICANT_EVENTS',
        user: 'analytics',
        timestamp: receivedAt,
        path: '/api/analytics/events',
        method: 'POST',
        body: {
          eventNames: significantEvents.map(e => e.name),
          count: significantEvents.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      received: events.length,
    });
  }),
  '/api/analytics/events',
  RateLimitPresets.GENERAL
);

/**
 * GET /api/analytics/events
 * Returns aggregated event counts for the analytics dashboard.
 * Requires authentication.
 */
export const GET = withRateLimit(withErrorHandling(async (request: Request) => {
  if (!(await isAuthenticated())) {
    return Errors.unauthorized('Authentication required to view analytics');
  }

  const url = new URL(request.url);
  const eventName = url.searchParams.get('event');
  const since = url.searchParams.get('since');

  let filtered = eventStore;

  if (eventName) {
    filtered = filtered.filter(e => e.name === eventName);
  }

  if (since) {
    const sinceDate = new Date(since).getTime();
    if (!isNaN(sinceDate)) {
      filtered = filtered.filter(e => new Date(e.receivedAt).getTime() >= sinceDate);
    }
  }

  // Aggregate by event name
  const counts: Record<string, number> = {};
  for (const event of filtered) {
    counts[event.name] = (counts[event.name] || 0) + 1;
  }

  // AARRR funnel metrics
  const funnel = {
    acquisition: {
      pageViews: counts['page_viewed'] || 0,
      signupStarted: counts['signup_started'] || 0,
      signupCompleted: counts['signup_completed'] || 0,
    },
    activation: {
      platformConnected: counts['platform_connected'] || 0,
      postCreated: counts['post_created'] || 0,
      postPublished: counts['post_published'] || 0,
    },
    revenue: {
      pricingViewed: counts['pricing_page_viewed'] || 0,
      trialStarted: counts['trial_started'] || 0,
      paymentCompleted: counts['payment_completed'] || 0,
    },
    referral: {
      linkShared: counts['referral_link_shared'] || 0,
      referralSignup: counts['referral_signup'] || 0,
    },
  };

  return NextResponse.json({
    totalEvents: filtered.length,
    counts,
    funnel,
  });
}), '/api/analytics/events', RateLimitPresets.GENERAL);
