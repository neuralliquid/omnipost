/**
 * Lead Lists API Routes
 * GET - List all lead lists
 * POST - Create new lead list
 */

import { NextResponse } from 'next/server';
import { leadsClient } from '@/lib/data/leads';
import {
  requireAuth,
  requireAuthWithUserId,
  validateRequiredFields,
  validateEnumField,
  validateArrayField,
  withErrorHandling,
} from '@/app/api/_utils/middleware';

/**
 * GET /api/leads/lists
 * List all lead lists
 */
export const GET = withErrorHandling(async () => {
  const authError = await requireAuth();
  if (authError) return authError;

  const lists = await leadsClient.getLists();

  return NextResponse.json({
    lists,
    count: lists.length,
  });
});

/**
 * POST /api/leads/lists
 * Create a new lead list
 */
export const POST = withErrorHandling(async (request: Request) => {
  const authResult = await requireAuthWithUserId();
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  // Validate required fields
  const requiredError = validateRequiredFields(body, ['name', 'type']);
  if (requiredError) return requiredError;

  // Validate type field
  const typeError = validateEnumField(body.type, ['static', 'dynamic'] as const, 'type');
  if (typeError) return typeError;

  // For dynamic lists, filter is required
  if (body.type === 'dynamic' && !body.filter) {
    return NextResponse.json({ error: 'filter is required for dynamic lists' }, { status: 400 });
  }

  // For static lists, leadIds can be provided
  if (body.type === 'static' && body.leadIds) {
    const arrayError = validateArrayField(body.leadIds, 'leadIds');
    if (arrayError) return arrayError;
  }

  const list = await leadsClient.createList({
    name: body.name.trim(),
    description: body.description?.trim(),
    type: body.type,
    filter: body.filter,
    leadIds: body.leadIds,
    createdBy: authResult.userId,
  });

  return NextResponse.json({ list }, { status: 201 });
});
