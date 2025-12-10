/**
 * Lead Tags API Routes
 * GET - List all tags
 * POST - Create new tag
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import { TAG_COLORS } from '@/types/lead';

/**
 * GET /api/leads/tags
 * List all tags
 */
export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tags = await leadsClient.getTags();

    return NextResponse.json({
      tags,
      count: tags.length,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

/**
 * POST /api/leads/tags
 * Create a new tag
 */
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Validate color (use default if not provided or invalid)
    let color = body.color;
    if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    }

    const tag = await leadsClient.createTag({
      name: body.name.trim(),
      color,
      description: body.description?.trim(),
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
