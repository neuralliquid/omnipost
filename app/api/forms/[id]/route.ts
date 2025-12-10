/**
 * Single Form API Routes
 * GET - Get form by ID
 * PATCH - Update form
 * DELETE - Delete form
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkRateLimitOrRespond, ErrorResponses, SuccessResponses } from '@/app/api/_utils/responses';
import { formsClient } from '@/lib/data/forms';

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
 * Uses stricter PUBLIC_API rate limiting since this endpoint supports public access
 */
export const GET = withRateLimit(
  async (request: NextRequest, ...args: unknown[]): Promise<Response> => {
    try {
      const { params } = args[0] as RouteParams;
      
      // Check if this is public access (embed/share)
      const { searchParams } = new URL(request.url);
      const isPublic = searchParams.get('public') === 'true';

      if (!isPublic && !(await isAuthenticated())) {
        return ErrorResponses.unauthorized();
      }

      const { id } = await params;
      const form = await formsClient.getForm(id);
      if (!form) {
        return ErrorResponses.notFound('Form');
      }

      // For public access, only return published forms
      if (isPublic && form.status !== 'published') {
        return ErrorResponses.notFound('Form');
      }

      // Track view for public access
      if (isPublic) {
        await formsClient.trackView(id);
      }

      return SuccessResponses.ok({ form });
    } catch (error) {
      return ErrorResponses.internalError('Error fetching form:', error);
    }
  },
  '/api/forms/[id]',
  RateLimitPresets.PUBLIC_API
);

/**
 * PATCH /api/forms/[id]
 * Update a form
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = checkRateLimitOrRespond(request, '/api/forms/[id]/patch', RateLimitPresets.GENERAL);
    if (rateLimitResponse) return rateLimitResponse;

    if (!(await isAuthenticated())) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await params;
    const existingForm = await formsClient.getForm(id);
    if (!existingForm) {
      return ErrorResponses.notFound('Form');
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
      return ErrorResponses.badRequest('Cannot publish a form without fields');
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

    return SuccessResponses.ok({ form });
  } catch (error) {
    return ErrorResponses.internalError('Error updating form:', error);
  }
}

/**
 * DELETE /api/forms/[id]
 * Delete a form
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = checkRateLimitOrRespond(request, '/api/forms/[id]/delete', RateLimitPresets.GENERAL);
    if (rateLimitResponse) return rateLimitResponse;

    if (!(await isAuthenticated())) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await params;
    const existingForm = await formsClient.getForm(id);
    if (!existingForm) {
      return ErrorResponses.notFound('Form');
    }

    const success = await formsClient.deleteForm(id);
    if (!success) {
      return ErrorResponses.internalError('Failed to delete form');
    }

    return SuccessResponses.deleted('Form deleted');
  } catch (error) {
    return ErrorResponses.internalError('Error deleting form:', error);
  }
}
