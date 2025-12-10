/**
 * Leads API Routes
 * GET - List/query leads
 * POST - Create new lead
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import type { LeadFilter, LeadSource, LeadStatus, LeadTemperature } from '@/types/lead';

// Valid status values
const VALID_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurturing'
];

// Valid source values
const VALID_SOURCES: LeadSource[] = [
  'linkedin', 'linkedin_sales_navigator', 'website', 'referral', 'cold_outreach',
  'content_engagement', 'survey', 'form', 'event', 'import', 'manual', 'other'
];

// Valid temperature values
const VALID_TEMPERATURES: LeadTemperature[] = ['cold', 'warm', 'hot'];

/**
 * GET /api/leads
 * List leads with optional filters
 */
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Build filter from query params
    const filter: LeadFilter = {};

    const status = searchParams.get('status');
    if (status) {
      const statuses = status.split(',') as LeadStatus[];
      if (statuses.every(s => VALID_STATUSES.includes(s))) {
        filter.status = statuses.length === 1 ? statuses[0] : statuses;
      }
    }

    const temperature = searchParams.get('temperature');
    if (temperature) {
      const temps = temperature.split(',') as LeadTemperature[];
      if (temps.every(t => VALID_TEMPERATURES.includes(t))) {
        filter.temperature = temps.length === 1 ? temps[0] : temps;
      }
    }

    const source = searchParams.get('source');
    if (source) {
      const sources = source.split(',') as LeadSource[];
      if (sources.every(s => VALID_SOURCES.includes(s))) {
        filter.source = sources.length === 1 ? sources[0] : sources;
      }
    }

    const tags = searchParams.get('tags');
    if (tags) {
      filter.tags = tags.split(',');
    }

    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const search = searchParams.get('search');
    if (search) {
      filter.search = search;
    }

    const scoreMin = searchParams.get('scoreMin');
    if (scoreMin) {
      filter.scoreMin = parseInt(scoreMin, 10);
    }

    const scoreMax = searchParams.get('scoreMax');
    if (scoreMax) {
      filter.scoreMax = parseInt(scoreMax, 10);
    }

    const inSequence = searchParams.get('inSequence');
    if (inSequence) {
      filter.inSequence = inSequence;
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
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
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.firstName?.trim()) {
      return NextResponse.json({ error: 'firstName is required' }, { status: 400 });
    }

    if (!body.lastName?.trim()) {
      return NextResponse.json({ error: 'lastName is required' }, { status: 400 });
    }

    if (!body.source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    if (!VALID_SOURCES.includes(body.source)) {
      return NextResponse.json({
        error: `source must be one of: ${VALID_SOURCES.join(', ')}`
      }, { status: 400 });
    }

    // Validate email format if provided
    if (body.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contact.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    const lead = await leadsClient.createLead({
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
    }, currentUserId);

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    const message = error instanceof Error ? error.message : 'Failed to create lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
