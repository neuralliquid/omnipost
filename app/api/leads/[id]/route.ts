/**
 * Single Lead API Routes
 * GET - Get lead by ID
 * PATCH - Update lead
 * DELETE - Delete lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import {
  VALID_LEAD_STATUSES,
  VALID_LEAD_TEMPERATURES,
} from '@/app/api/_utils/constants';
import {
  checkAuthAndRateLimit,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';

// Zod schema for updating a lead
const updateLeadSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(100)
    .transform(sanitizeText)
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(100)
    .transform(sanitizeText)
    .optional(),
  title: z
    .string()
    .max(200)
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
  status: z.enum(VALID_LEAD_STATUSES as unknown as [string, ...string[]]).optional(),
  temperature: z.enum(VALID_LEAD_TEMPERATURES as unknown as [string, ...string[]]).optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z
    .string()
    .max(10000)
    .transform(sanitizeText)
    .optional(),
  nextFollowUpAt: z.string().datetime({ message: 'Invalid date format' }).optional(),
  customFields: z.record(z.unknown()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]
 * Get a lead by ID with interactions
 */
export const GET = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/[id]',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;

  const lead = await leadsClient.getLead(id);
  if (!lead) {
    return ErrorResponses.notFound('Lead');
  }

  // Fetch interactions
  const { searchParams } = new URL(request.url);
  const includeInteractions = searchParams.get('includeInteractions') === 'true';

  if (includeInteractions) {
    const interactions = await leadsClient.getInteractions(id);
    return NextResponse.json({ lead: { ...lead, interactions } });
  }

  return NextResponse.json({ lead });
});

/**
 * PATCH /api/leads/[id]
 * Update a lead
 */
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/[id]',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;

  // Check if lead exists
  const existingLead = await leadsClient.getLead(id);
  if (!existingLead) {
    return ErrorResponses.notFound('Lead');
  }

  const body = await request.json();

  // Validate with Zod
  const parseResult = updateLeadSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const data = parseResult.data;

  const lead = await leadsClient.updateLead(id, {
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.title,
    contact: data.contact,
    company: data.company,
    status: data.status as typeof VALID_LEAD_STATUSES[number] | undefined,
    temperature: data.temperature as typeof VALID_LEAD_TEMPERATURES[number] | undefined,
    assignedTo: data.assignedTo,
    tags: data.tags,
    notes: data.notes,
    nextFollowUpAt: data.nextFollowUpAt,
    customFields: data.customFields,
  });

  return NextResponse.json({ lead });
});

/**
 * DELETE /api/leads/[id]
 * Delete a lead
 */
export const DELETE = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/[id]',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;

  // Check if lead exists
  const existingLead = await leadsClient.getLead(id);
  if (!existingLead) {
    return ErrorResponses.notFound('Lead');
  }

  const success = await leadsClient.deleteLead(id);
  if (!success) {
    return ErrorResponses.internalError('Failed to delete lead');
  }

  return NextResponse.json({ success: true, message: 'Lead deleted' });
});
