/**
 * Single Form API Routes
 * GET - Get form by ID
 * PATCH - Update form
 * DELETE - Delete form
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { checkRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { formsClient } from '@/lib/data/forms';
import type { FormStatus } from '@/types/survey';

// Valid status values
const VALID_STATUSES: FormStatus[] = ['draft', 'published', 'closed', 'archived'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forms/[id]
 * Get a form by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms/[id]', RateLimitPresets.GENERAL);
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

    // Allow public access for form viewing (embed/share)
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    if (!isPublic && !(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const form = await formsClient.getForm(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // For public access, only return published forms
    if (isPublic && form.status !== 'published') {
      return NextResponse.json({ error: 'Form not available' }, { status: 404 });
    }

    // Track view for public access
    if (isPublic) {
      await formsClient.trackView(id);
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

/**
 * PATCH /api/forms/[id]
 * Update a form
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if form exists
    const existingForm = await formsClient.getForm(id);
    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
    }

    // Cannot publish a form without fields
    if (body.status === 'published' && existingForm.fields.length === 0) {
      return NextResponse.json({
        error: 'Cannot publish a form without fields'
      }, { status: 400 });
    }

    const form = await formsClient.updateForm(id, {
      name: body.name?.trim(),
      description: body.description?.trim(),
      status: body.status,
      theme: body.theme,
      completionSettings: body.completionSettings,
      notificationSettings: body.notificationSettings,
      integrations: body.integrations,
      tags: body.tags,
    });

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error updating form:', error);
    const message = error instanceof Error ? error.message : 'Failed to update form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/forms/[id]
 * Delete a form
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if form exists
    const existingForm = await formsClient.getForm(id);
    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const success = await formsClient.deleteForm(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Form deleted' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}
