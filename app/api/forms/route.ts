/**
 * Forms API Routes
 * GET - List forms
 * POST - Create new form
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
import { sanitizeText } from '@/app/api/_utils/sanitize';
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

  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);

  // Validate and type-assert status if provided
  let status: FormStatus | undefined;
  if (statusParam) {
    const statusError = validateEnumField(statusParam, VALID_FORM_STATUSES, 'status');
    if (statusError) return statusError;
    // Safe to cast after validation
    status = statusParam as FormStatus;
  }

  // Validate and type-assert type if provided
  let type: Form['type'] | undefined;
  if (typeParam) {
    const typeError = validateEnumField(typeParam, VALID_FORM_TYPES, 'type');
    if (typeError) return typeError;
    // Safe to cast after validation
    type = typeParam as Form['type'];
  }

  const result = await formsClient.queryForms({
    status,
    type,
    page,
    pageSize: Math.min(pageSize, 50),
  });

  return NextResponse.json({
    success: true,
    data: {
      forms: result.forms,
      pagination: result.pagination,
    },
    message: 'Forms retrieved successfully',
  });
});

// Zod schema for form field validation
const formFieldSchema = z.object({
  type: z.enum(VALID_FORM_FIELD_TYPES as [string, ...string[]]),
  name: z.string().min(1, 'Field name is required').transform(sanitizeText),
  label: z.string().min(1, 'Field label is required').transform(sanitizeText),
  placeholder: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
  helpText: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  validation: z.any().optional(),
  options: z.any().optional(),
  conditionalLogic: z.any().optional(),
});

// Zod schema for create form input
const createFormSchema = z.object({
  name: z.string().min(1, 'Form name is required').transform(sanitizeText),
  type: z.enum(VALID_FORM_TYPES as [string, ...string[]]),
  description: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
  theme: z.any().optional(),
  integrations: z.any().optional(),
  tags: z.array(z.string()).optional(),
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

  // Validate and sanitize using Zod schema
  const parseResult = createFormSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const sanitizedData = parseResult.data;

  // Assign order to fields if not provided
  sanitizedData.fields = sanitizedData.fields.map((field, index) => ({
    ...field,
    order: field.order !== undefined ? field.order : index + 1,
  }));

  const form = await formsClient.createForm(sanitizedData, authResult.userId);

  return NextResponse.json(
    {
      success: true,
      data: { form },
      message: 'Form created successfully',
    },
    { status: 201 }
  );
});
