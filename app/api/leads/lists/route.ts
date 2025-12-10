/**
 * Lead Lists API Routes
 * GET - List all lead lists
 * POST - Create new lead list
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';

/**
 * GET /api/leads/lists
 * List all lead lists
 */
export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const lists = await leadsClient.getLists();

    return NextResponse.json({
      lists,
      count: lists.length,
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

/**
 * POST /api/leads/lists
 * Create a new lead list
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
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!body.type || !['static', 'dynamic'].includes(body.type)) {
      return NextResponse.json({ error: 'type must be "static" or "dynamic"' }, { status: 400 });
    }

    // For dynamic lists, filter is required
    if (body.type === 'dynamic' && !body.filter) {
      return NextResponse.json({ error: 'filter is required for dynamic lists' }, { status: 400 });
    }

    // For static lists, leadIds can be provided
    if (body.type === 'static' && body.leadIds && !Array.isArray(body.leadIds)) {
      return NextResponse.json({ error: 'leadIds must be an array' }, { status: 400 });
    }

    const list = await leadsClient.createList({
      name: body.name.trim(),
      description: body.description?.trim(),
      type: body.type,
      filter: body.filter,
      leadIds: body.leadIds,
      createdBy: currentUserId,
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    const message = error instanceof Error ? error.message : 'Failed to create list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
