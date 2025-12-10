/**
 * Single Lead API Routes
 * GET - Get lead by ID
 * PATCH - Update lead
 * DELETE - Delete lead
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import type { LeadStatus, LeadTemperature } from '@/types/lead';

// Valid status values
const VALID_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurturing'
];

// Valid temperature values
const VALID_TEMPERATURES: LeadTemperature[] = ['cold', 'warm', 'hot'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]
 * Get a lead by ID with interactions
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await leadsClient.getLead(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch interactions
    const { searchParams } = new URL(request.url);
    const includeInteractions = searchParams.get('includeInteractions') === 'true';

    if (includeInteractions) {
      const interactions = await leadsClient.getInteractions(id);
      return NextResponse.json({ lead: { ...lead, interactions } });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[id]
 * Update a lead
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if lead exists
    const existingLead = await leadsClient.getLead(id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
    }

    // Validate temperature if provided
    if (body.temperature && !VALID_TEMPERATURES.includes(body.temperature)) {
      return NextResponse.json({
        error: `temperature must be one of: ${VALID_TEMPERATURES.join(', ')}`
      }, { status: 400 });
    }

    // Validate email format if provided
    if (body.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contact.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
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
  } catch (error) {
    console.error('Error updating lead:', error);
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if lead exists
    const existingLead = await leadsClient.getLead(id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const success = await leadsClient.deleteLead(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
