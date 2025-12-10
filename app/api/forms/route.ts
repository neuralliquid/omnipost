/**
 * Forms API Routes
 * GET - List forms
 * POST - Create new form
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { formsClient } from '@/lib/data/forms';
import {
  VALID_FORM_STATUSES,
  VALID_FORM_TYPES,
  VALID_FORM_FIELD_TYPES,
} from '@/app/api/_utils/constants';
import {
  checkAuthAndRateLimit,
  requireAuthWithUserId,
  validateRequiredFields,
  validateEnumField,
  validateArrayField,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import type { FormStatus, Form } from '@/types/survey';

/**
 * GET /api/forms
 * List forms with optional filters
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  // Check rate limit and auth
  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/forms',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  // Validate status if provided
  if (status) {
    const statusError = validateEnumField(status, VALID_FORM_STATUSES, 'status');
    if (statusError) return statusError;
  }

  // Validate type if provided
  if (type) {
    const typeError = validateEnumField(type, VALID_FORM_TYPES, 'type');
    if (typeError) return typeError;
  }

  const result = await formsClient.queryForms({
    status: (status as FormStatus) || undefined,
    type: (type as Form['type']) || undefined,
    page,
    pageSize: Math.min(pageSize, 50),
  });

  return NextResponse.json({
    forms: result.forms,
    pagination: result.pagination,
  });
});

/**
 * POST /api/forms
 * Create a new form
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  // Check rate limit and auth
  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/forms',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate required fields
  const requiredError = validateRequiredFields(body, ['name', 'type', 'fields']);
  if (requiredError) return requiredError;

  // Validate type
  const typeError = validateEnumField(body.type, VALID_FORM_TYPES, 'type');
  if (typeError) return typeError;

  // Validate fields array
  const arrayError = validateArrayField(body.fields, 'fields', 1);
  if (arrayError) return arrayError;

  // Validate each field
  for (let i = 0; i < body.fields.length; i++) {
    const field = body.fields[i];

    // Validate field type
    if (!field.type || !VALID_FORM_FIELD_TYPES.includes(field.type)) {
      return ErrorResponses.badRequest(
        `Field ${i + 1}: type must be one of: ${VALID_FORM_FIELD_TYPES.join(', ')}`
      );
    }

    // Validate field name
    if (!field.name?.trim()) {
      return ErrorResponses.badRequest(`Field ${i + 1}: name is required`);
    }

    // Validate field label
    if (!field.label?.trim()) {
      return ErrorResponses.badRequest(`Field ${i + 1}: label is required`);
    }

    // Assign order if not provided
    if (field.order === undefined) {
      field.order = i + 1;
    }
  }

  const form = await formsClient.createForm(
    {
      name: body.name.trim(),
      description: body.description?.trim(),
      type: body.type,
      fields: body.fields,
      theme: body.theme,
      integrations: body.integrations,
      tags: body.tags,
    },
    authResult.userId
  );

  return NextResponse.json({ form }, { status: 201 });
});
