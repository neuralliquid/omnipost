/**
 * Forms API Routes
 * GET - List forms
 * POST - Create new form
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { checkRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { formsClient } from '@/lib/data/forms';
import type { FormStatus, Form } from '@/types/survey';

// Valid status values
const VALID_STATUSES: FormStatus[] = ['draft', 'published', 'closed', 'archived'];

// Valid form types
const VALID_TYPES: Form['type'][] = ['form', 'survey', 'quiz', 'poll'];

// Valid field types
const VALID_FIELD_TYPES = [
  'text', 'email', 'phone', 'number', 'textarea', 'select', 'multiselect',
  'radio', 'checkbox', 'date', 'time', 'datetime', 'file', 'rating', 'nps',
  'scale', 'matrix', 'hidden', 'section', 'page_break'
];

/**
 * GET /api/forms
 * List forms with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms', RateLimitPresets.GENERAL);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.GENERAL.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as FormStatus | null;
    const type = searchParams.get('type') as Form['type'] | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({
        error: `type must be one of: ${VALID_TYPES.join(', ')}`
      }, { status: 400 });
    }

    const result = await formsClient.queryForms({
      status: status || undefined,
      type: type || undefined,
      page,
      pageSize: Math.min(pageSize, 50),
    });

    return NextResponse.json({
      forms: result.forms,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

/**
 * POST /api/forms
 * Create a new form
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms', RateLimitPresets.GENERAL);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.GENERAL.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

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

    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({
        error: `type must be one of: ${VALID_TYPES.join(', ')}`
      }, { status: 400 });
    }

    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json({ error: 'fields must be a non-empty array' }, { status: 400 });
    }

    // Validate each field
    for (let i = 0; i < body.fields.length; i++) {
      const field = body.fields[i];

      if (!field.type || !VALID_FIELD_TYPES.includes(field.type)) {
        return NextResponse.json({
          error: `Field ${i + 1}: type must be one of: ${VALID_FIELD_TYPES.join(', ')}`
        }, { status: 400 });
      }

      if (!field.name?.trim()) {
        return NextResponse.json({
          error: `Field ${i + 1}: name is required`
        }, { status: 400 });
      }

      if (!field.label?.trim()) {
        return NextResponse.json({
          error: `Field ${i + 1}: label is required`
        }, { status: 400 });
      }

      // Assign order if not provided
      if (field.order === undefined) {
        field.order = i + 1;
      }
    }

    const form = await formsClient.createForm({
      name: body.name.trim(),
      description: body.description?.trim(),
      type: body.type,
      fields: body.fields,
      theme: body.theme,
      integrations: body.integrations,
      tags: body.tags,
    }, currentUserId);

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    const message = error instanceof Error ? error.message : 'Failed to create form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
