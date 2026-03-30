/**
 * Lead Tags API Routes
 * GET - List all tags
 * POST - Create new tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import { TAG_COLORS } from '@/types/lead';
import { webcrypto } from 'node:crypto';
import {
  checkAuthAndRateLimit,
  withErrorHandling,
} from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';

/**
 * Generate a cryptographically secure random index for array selection
 */
function getSecureRandomIndex(arrayLength: number): number {
  const randomBytes = new Uint32Array(1);
  webcrypto.getRandomValues(randomBytes);
  return randomBytes[0] % arrayLength;
}

// Zod schema for creating a tag
const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(100, 'Tag name must be at most 100 characters')
    .transform(sanitizeText),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .transform(sanitizeText)
    .optional(),
});

/**
 * GET /api/leads/tags
 * List all tags
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/tags',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const tags = await leadsClient.getTags();

  return NextResponse.json({
    tags,
    count: tags.length,
  });
});

/**
 * POST /api/leads/tags
 * Create a new tag
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/tags',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const body = await request.json();

  // Validate with Zod
  const parseResult = createTagSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const { name, description } = parseResult.data;
  const color = parseResult.data.color || TAG_COLORS[getSecureRandomIndex(TAG_COLORS.length)];

  const tag = await leadsClient.createTag({
    name,
    color,
    description,
  });

  return NextResponse.json({ tag }, { status: 201 });
});
