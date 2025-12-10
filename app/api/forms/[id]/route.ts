/**
 * Single Form API Routes
 * GET - Get form by ID
 * PATCH - Update form
 * DELETE - Delete form
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { checkRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { formsClient } from '@/lib/data/forms';
import type { FormStatus } from '@/types/survey';

// Valid status values
const VALID_STATUSES: FormStatus[] = ['draft', 'published', 'closed', 'archived'];

// Zod schema for form update validation
const updateFormSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['draft', 'published', 'closed', 'archived']).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    logoUrl: z.string().url().optional(),
  }).passthrough().optional(),
  completionSettings: z.object({
    redirectUrl: z.string().url().optional(),
    showConfirmation: z.boolean().optional(),
    confirmationMessage: z.string().optional(),
  }).passthrough().optional(),
  notificationSettings: z.object({
    notifyOnSubmission: z.boolean().optional(),
    notificationEmails: z.array(z.string().email()).optional(),
  }).passthrough().optional(),
  integrations: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
}).strict();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forms/[id]
 * Get a form by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if this is public access (embed/share)
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    // Use stricter rate limiting for public access to prevent abuse
    const rateLimit = isPublic ? RateLimitPresets.PUBLIC_API : RateLimitPresets.GENERAL;
    const rateLimitResult = checkRateLimit(
      request,
      isPublic ? '/api/forms/[id]/public' : '/api/forms/[id]',
      rateLimit
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

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
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms/[id]/patch', RateLimitPresets.GENERAL);
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

    const { id } = await params;

    // Check if form exists
    const existingForm = await formsClient.getForm(id);
    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Parse and validate request body with Zod
    let body: z.infer<typeof updateFormSchema>;
    try {
      const rawBody = await request.json();
      body = updateFormSchema.parse(rawBody);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: zodError.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }, { status: 400 });
      }
      throw zodError;
    }

    // Cannot publish a form without fields
    if (body.status === 'published' && existingForm.fields.length === 0) {
      return NextResponse.json({
        error: 'Cannot publish a form without fields'
      }, { status: 400 });
    }

    const form = await formsClient.updateForm(id, {
      name: body.name,
      description: body.description,
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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms/[id]/delete', RateLimitPresets.GENERAL);
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
