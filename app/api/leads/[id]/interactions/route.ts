/**
 * Lead Interactions API Routes
 * GET - Get interactions for a lead
 * POST - Add interaction to a lead
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import type { LeadInteraction } from '@/types/lead';

// Valid interaction types
const VALID_INTERACTION_TYPES: LeadInteraction['type'][] = [
  'email_sent', 'email_opened', 'email_clicked', 'email_replied',
  'linkedin_message', 'linkedin_connection', 'linkedin_view',
  'call', 'meeting', 'note', 'form_submission', 'content_view',
  'survey_response', 'status_change', 'tag_added', 'tag_removed'
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]/interactions
 * Get all interactions for a lead
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if lead exists
    const lead = await leadsClient.getLead(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const interactions = await leadsClient.getInteractions(id);

    return NextResponse.json({
      interactions,
      count: interactions.length,
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}

/**
 * POST /api/leads/[id]/interactions
 * Add an interaction to a lead
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    const { id } = await params;

    // Check if lead exists
    const lead = await leadsClient.getLead(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    if (!VALID_INTERACTION_TYPES.includes(body.type)) {
      return NextResponse.json({
        error: `type must be one of: ${VALID_INTERACTION_TYPES.join(', ')}`
      }, { status: 400 });
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    const interaction = await leadsClient.addInteraction(id, {
      type: body.type,
      description: body.description.trim(),
      metadata: body.metadata,
      createdBy: currentUserId || undefined,
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error('Error adding interaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to add interaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
