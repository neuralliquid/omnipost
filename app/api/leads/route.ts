/**
 * Leads API Routes
 * GET - List/query leads
 * POST - Create new lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import type { LeadFilter } from '@/types/lead';
import {
  VALID_LEAD_STATUSES,
  VALID_LEAD_SOURCES,
  VALID_LEAD_TEMPERATURES,
} from '@/app/api/_utils/constants';
import {
  checkAuthAndRateLimit,
  requireAuthWithUserId,
  withErrorHandling,
  parseEnumFilter,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';

// Zod schema for creating a lead
const createLeadSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters')
    .transform(sanitizeText),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters')
    .transform(sanitizeText),
  title: z
    .string()
    .max(200, 'Title must be at most 200 characters')
    .transform(sanitizeText)
    .optional(),
  contact: z
    .object({
      email: z.string().email('Invalid email address').optional(),
      phone: z.string().max(50).optional(),
      linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
      twitterHandle: z.string().max(50).optional(),
      website: z.string().url('Invalid website URL').optional(),
    })
    .optional(),
  company: z
    .object({
      name: z.string().max(200).optional(),
      industry: z.string().max(100).optional(),
      size: z.string().max(20).optional(),
      website: z.string().url('Invalid company website URL').optional(),
      linkedinUrl: z.string().url('Invalid company LinkedIn URL').optional(),
      location: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
    })
    .optional(),
  source: z.enum(VALID_LEAD_SOURCES as unknown as [string, ...string[]]),
  sourceDetails: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  notes: z
    .string()
    .max(10000, 'Notes must be at most 10000 characters')
    .transform(sanitizeText)
    .optional(),
  customFields: z.record(z.unknown()).optional(),
  linkedinData: z.record(z.unknown()).optional(),
});

/**
 * GET /api/leads
 * List leads with optional filters
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { searchParams } = new URL(request.url);

  // Build filter from query params
  const filter: LeadFilter = {};

  filter.status = parseEnumFilter(searchParams.get('status'), VALID_LEAD_STATUSES);
  filter.temperature = parseEnumFilter(searchParams.get('temperature'), VALID_LEAD_TEMPERATURES);
  filter.source = parseEnumFilter(searchParams.get('source'), VALID_LEAD_SOURCES);

  const tags = searchParams.get('tags');
  if (tags) filter.tags = tags.split(',');

  const assignedTo = searchParams.get('assignedTo');
  if (assignedTo) filter.assignedTo = assignedTo;

  const search = searchParams.get('search');
  if (search) filter.search = search;

  const scoreMin = searchParams.get('scoreMin');
  if (scoreMin) filter.scoreMin = Math.max(0, Math.min(Number.parseInt(scoreMin, 10), 1000));

  const scoreMax = searchParams.get('scoreMax');
  if (scoreMax) filter.scoreMax = Math.max(0, Math.min(Number.parseInt(scoreMax, 10), 1000));

  const inSequence = searchParams.get('inSequence');
  if (inSequence) filter.inSequence = inSequence;

  // Pagination
  const page = Math.min(Number.parseInt(searchParams.get('page') || '1', 10), 1000);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);
  const sortField = searchParams.get('sortField') || 'CreatedAt';
  const sortDirectionParam = searchParams.get('sortDirection') || 'desc';
  // Safely validate sortDirection to only allow 'asc' or 'desc'
  const sortDirection: 'asc' | 'desc' = sortDirectionParam === 'asc' ? 'asc' : 'desc';

  const result = await leadsClient.queryLeads(filter, {
    page,
    pageSize: Math.min(pageSize, 100), // Max 100 per page
    sortField,
    sortDirection,
  });

  return NextResponse.json({
    leads: result.leads,
    pagination: result.pagination,
  });
});

/**
 * POST /api/leads
 * Create a new lead
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate with Zod
  const parseResult = createLeadSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const data = parseResult.data;

  const lead = await leadsClient.createLead(
    {
      firstName: data.firstName,
      lastName: data.lastName,
      title: data.title,
      contact: data.contact,
      company: data.company,
      source: data.source as (typeof VALID_LEAD_SOURCES)[number],
      sourceDetails: data.sourceDetails,
      tags: data.tags,
      notes: data.notes,
      customFields: data.customFields,
      linkedinData: data.linkedinData,
    },
    authResult.userId
  );

  return NextResponse.json({ lead }, { status: 201 });
});
