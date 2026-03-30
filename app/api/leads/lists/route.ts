/**
 * Lead Lists API Routes
 * GET - List all lead lists
 * POST - Create new lead list
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import {
  checkAuthAndRateLimit,
  requireAuthWithUserId,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';

// Zod schema for creating a lead list
const createListSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(200, 'List name must be at most 200 characters')
    .transform(sanitizeText),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .transform(sanitizeText)
    .optional(),
  type: z.enum(['static', 'dynamic']),
  filter: z.record(z.unknown()).optional(),
  leadIds: z.array(z.string()).optional(),
});

/**
 * GET /api/leads/lists
 * List all lead lists
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/lists',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const lists = await leadsClient.getLists();

  return NextResponse.json({
    lists,
    count: lists.length,
  });
});

/**
 * POST /api/leads/lists
 * Create a new lead list
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/lists',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate with Zod
  const parseResult = createListSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const data = parseResult.data;

  // For dynamic lists, filter is required
  if (data.type === 'dynamic' && !data.filter) {
    return ErrorResponses.badRequest('filter is required for dynamic lists');
  }

  const list = await leadsClient.createList({
    name: data.name,
    description: data.description,
    type: data.type,
    filter: data.filter,
    leadIds: data.leadIds,
    createdBy: authResult.userId,
  });

  return NextResponse.json({ list }, { status: 201 });
});
