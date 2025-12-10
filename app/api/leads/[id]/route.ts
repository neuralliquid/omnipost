/**
 * Single Lead API Routes
 * GET - Get lead by ID
 * PATCH - Update lead
 * DELETE - Delete lead
 */

import { NextResponse } from 'next/server';
import { leadsClient } from '@/lib/data/leads';
import {
  VALID_LEAD_STATUSES,
  VALID_LEAD_TEMPERATURES,
} from '@/app/api/_utils/constants';
import {
  requireAuth,
  validateEnumField,
  validateEmailFormat,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]
 * Get a lead by ID with interactions
 */
export const GET = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const authError = await requireAuth();
  if (authError) return authError;

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
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // Check if lead exists
  const existingLead = await leadsClient.getLead(id);
  if (!existingLead) {
    return ErrorResponses.notFound('Lead');
  }

  const body = await request.json();

  // Validate status if provided
  if (body.status) {
    const statusError = validateEnumField(body.status, VALID_LEAD_STATUSES, 'status');
    if (statusError) return statusError;
  }

  // Validate temperature if provided
  if (body.temperature) {
    const tempError = validateEnumField(
      body.temperature,
      VALID_LEAD_TEMPERATURES,
      'temperature'
    );
    if (tempError) return tempError;
  }

  // Validate email format if provided
  if (body.contact?.email) {
    const emailError = validateEmailFormat(body.contact.email);
    if (emailError) return emailError;
  }

  const lead = await leadsClient.updateLead(id, {
    firstName: body.firstName?.trim(),
    lastName: body.lastName?.trim(),
    title: body.title?.trim(),
    contact: body.contact,
    company: body.company,
    status: body.status,
    temperature: body.temperature,
    assignedTo: body.assignedTo,
    tags: body.tags,
    notes: body.notes,
    nextFollowUpAt: body.nextFollowUpAt,
    customFields: body.customFields,
  });

  return NextResponse.json({ lead });
});

/**
 * DELETE /api/leads/[id]
 * Delete a lead
 */
export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const authError = await requireAuth();
  if (authError) return authError;

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
