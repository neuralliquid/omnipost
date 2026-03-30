/**
 * Lead Interactions API Routes
 * GET - Get interactions for a lead
 * POST - Add interaction to a lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import type { LeadInteraction } from '@/types/lead';
import {
  checkAuthAndRateLimit,
  requireAuthWithUserId,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';

// Valid interaction types
const VALID_INTERACTION_TYPES: readonly LeadInteraction['type'][] = [
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_replied',
  'linkedin_message',
  'linkedin_connection',
  'linkedin_view',
  'call',
  'meeting',
  'note',
  'form_submission',
  'content_view',
  'survey_response',
  'status_change',
  'tag_added',
  'tag_removed',
] as const;

// Zod schema for creating an interaction
const createInteractionSchema = z.object({
  type: z.enum(VALID_INTERACTION_TYPES as unknown as [string, ...string[]]),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be at most 5000 characters')
    .transform(sanitizeText),
  metadata: z.record(z.unknown()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]/interactions
 * Get all interactions for a lead
 */
export const GET = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/[id]/interactions',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;

  // Check if lead exists
  const lead = await leadsClient.getLead(id);
  if (!lead) {
    return ErrorResponses.notFound('Lead');
  }

  const interactions = await leadsClient.getInteractions(id);

  return NextResponse.json({
    interactions,
    count: interactions.length,
  });
});

/**
 * POST /api/leads/[id]/interactions
 * Add an interaction to a lead
 */
export const POST = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/[id]/interactions',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const { id } = await params;

  // Check if lead exists
  const lead = await leadsClient.getLead(id);
  if (!lead) {
    return ErrorResponses.notFound('Lead');
  }

  const body = await request.json();

  // Validate with Zod
  const parseResult = createInteractionSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const { type, description, metadata } = parseResult.data;

  const interaction = await leadsClient.addInteraction(id, {
    type: type as LeadInteraction['type'],
    description,
    metadata,
    createdBy: authResult.userId,
  });

  return NextResponse.json({ interaction }, { status: 201 });
});
