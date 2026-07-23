/**
 * Scheduler API Routes
 * GET - List scheduled jobs
 * POST - Create new scheduled job
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getScheduler } from '@/lib/scheduler';
import type { JobStatus } from '@/lib/scheduler/types';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { Errors, withErrorHandling } from '@/app/api/_utils/errors';
import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { sanitizeText, validateAndSanitize } from '@/app/api/_utils/sanitize';
import { platforms } from '@/lib/config/platforms';

// ── Zod Schemas ──────────────────────────────────────────────────────────

const listJobsQuerySchema = z.object({
  status: z
    .enum(['pending', 'scheduled', 'processing', 'published', 'failed', 'dead', 'cancelled'])
    .optional(),
  campaignId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const jobContentSchema = z.object({
  text: z
    .string()
    .min(1, 'Content text is required')
    .max(100_000, 'Content text too large')
    .transform(val => sanitizeText(val)),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  isThread: z.boolean().optional(),
  threadParts: z
    .array(
      z.object({
        order: z.number().int().min(0),
        text: z
          .string()
          .min(1)
          .transform(val => sanitizeText(val)),
        mediaUrls: z.array(z.string().url()).optional(),
      })
    )
    .optional(),
});

const createJobSchema = z.object({
  type: z.enum(['campaign_post', 'series_promotion', 'standalone']),
  campaignId: z.string().min(1).optional(),
  contentId: z.string().min(1, 'contentId is required'),
  platformId: z.string().min(1, 'platformId is required'),
  content: jobContentSchema,
  scheduledTime: z.string().refine(val => !Number.isNaN(new Date(val).getTime()), {
    message: 'Invalid scheduledTime format',
  }),
  timezone: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
});

function getComingSoonPlatformName(platformId: string): string | undefined {
  const normalizedPlatformId = platformId.toLowerCase();
  const platform = platforms.find(p => p.slug === normalizedPlatformId);

  return platform?.comingSoon ? platform.name : undefined;
}

// ── Route Handlers ───────────────────────────────────────────────────────

/**
 * GET /api/scheduler
 * List scheduled jobs with optional filters (user-scoped)
 */
export const GET = withRateLimit(
  withErrorHandling(async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required');
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return Errors.unauthorized('User ID not found');
    }

    const { searchParams } = new URL(request.url);
    const queryInput = {
      status: searchParams.get('status') || undefined,
      campaignId: searchParams.get('campaignId') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validation = validateAndSanitize(listJobsQuerySchema, queryInput);
    if (!validation.success) {
      return Errors.badRequest('Invalid query parameters: ' + validation.errors.join(', '));
    }

    const { status, campaignId, limit, offset } = validation.data;
    const scheduler = getScheduler();

    let jobs;
    if (campaignId) {
      jobs = await scheduler.getJobsByCampaign(campaignId);
    } else if (status) {
      jobs = await scheduler.getJobsByStatus(status as JobStatus, limit + offset);
    } else {
      jobs = await scheduler.getAllJobs();
    }

    // Filter jobs by current user
    const userJobs = jobs.filter(job => job.createdBy === currentUserId);

    // Apply pagination
    const paginated = userJobs.slice(offset, offset + limit);

    return NextResponse.json({
      jobs: paginated,
      count: paginated.length,
      total: userJobs.length,
    });
  }),
  '/api/scheduler',
  RateLimitPresets.GENERAL
);

/**
 * POST /api/scheduler
 * Create a new scheduled job (user-scoped)
 */
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required');
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return Errors.unauthorized('User ID not found');
    }

    const body = await request.json();

    const validation = validateAndSanitize(createJobSchema, body);
    if (!validation.success) {
      return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
    }

    const data = validation.data;
    const comingSoonPlatformName = getComingSoonPlatformName(data.platformId);
    if (comingSoonPlatformName) {
      return Errors.badRequest(`${comingSoonPlatformName} publishing is coming soon`);
    }

    const scheduler = getScheduler();
    const job = await scheduler.schedule({
      type: data.type,
      campaignId: data.campaignId,
      contentId: data.contentId,
      platformId: data.platformId,
      content: data.content,
      scheduledTime: data.scheduledTime,
      timezone: data.timezone,
      maxAttempts: data.maxAttempts,
      createdBy: currentUserId,
    });

    return NextResponse.json({ job }, { status: 201 });
  }),
  '/api/scheduler',
  RateLimitPresets.GENERAL
);
