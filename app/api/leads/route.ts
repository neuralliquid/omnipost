/**
 * Leads API Routes
 * GET - List/query leads
 * POST - Create new lead
 */

import { NextResponse } from 'next/server';
import { leadsClient } from '@/lib/data/leads';
import type { LeadFilter } from '@/types/lead';
import {
  VALID_LEAD_STATUSES,
  VALID_LEAD_SOURCES,
  VALID_LEAD_TEMPERATURES,
} from '@/app/api/_utils/constants';
import {
  requireAuth,
  requireAuthWithUserId,
  validateRequiredFields,
  validateEnumField,
  validateEmailFormat,
  withErrorHandling,
  parseEnumFilter,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';

/**
 * GET /api/leads
 * List leads with optional filters
 */
export const GET = withErrorHandling(async (request: Request) => {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);

  // Build filter from query params
  const filter: LeadFilter = {};

  filter.status = parseEnumFilter(searchParams.get('status'), VALID_LEAD_STATUSES);
  filter.temperature = parseEnumFilter(
    searchParams.get('temperature'),
    VALID_LEAD_TEMPERATURES
  );
  filter.source = parseEnumFilter(searchParams.get('source'), VALID_LEAD_SOURCES);

  const tags = searchParams.get('tags');
  if (tags) filter.tags = tags.split(',');

  const assignedTo = searchParams.get('assignedTo');
  if (assignedTo) filter.assignedTo = assignedTo;

  const search = searchParams.get('search');
  if (search) filter.search = search;

  const scoreMin = searchParams.get('scoreMin');
  if (scoreMin) filter.scoreMin = Number.parseInt(scoreMin, 10);

  const scoreMax = searchParams.get('scoreMax');
  if (scoreMax) filter.scoreMax = Number.parseInt(scoreMax, 10);

  const inSequence = searchParams.get('inSequence');
  if (inSequence) filter.inSequence = inSequence;

  // Pagination
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);
  const sortField = searchParams.get('sortField') || 'CreatedAt';
  const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';

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
  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate required fields
  const requiredError = validateRequiredFields(body, [
    'firstName',
    'lastName',
    'source',
  ]);
  if (requiredError) return requiredError;

  // Validate source
  const sourceError = validateEnumField(body.source, VALID_LEAD_SOURCES, 'source');
  if (sourceError) return sourceError;

  // Validate email format if provided
  if (body.contact?.email) {
    const emailError = validateEmailFormat(body.contact.email);
    if (emailError) return emailError;
  }

  const lead = await leadsClient.createLead(
    {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      title: body.title?.trim(),
      contact: body.contact,
      company: body.company,
      source: body.source,
      sourceDetails: body.sourceDetails,
      tags: body.tags,
      notes: body.notes,
      customFields: body.customFields,
      linkedinData: body.linkedinData,
    },
    authResult.userId
  );

  return NextResponse.json({ lead }, { status: 201 });
});
