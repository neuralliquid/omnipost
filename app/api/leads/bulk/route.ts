/**
 * Lead Bulk Operations API Routes
 * POST - Perform bulk operations on leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { leadsClient } from '@/lib/data/leads';
import { VALID_LEAD_STATUSES, VALID_LEAD_TEMPERATURES } from '@/app/api/_utils/constants';
import { checkAuthAndRateLimit, withErrorHandling } from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';

// Valid bulk operations
const VALID_OPERATIONS = ['update', 'delete', 'addTag', 'removeTag', 'assignTo'] as const;

// Zod schema for bulk operation
const bulkOperationSchema = z.object({
  operation: z.enum(VALID_OPERATIONS),
  leadIds: z
    .array(z.string().min(1))
    .min(1, 'leadIds must be a non-empty array')
    .max(100, 'Maximum 100 leads per bulk operation'),
  data: z.record(z.unknown()).optional(),
});

/**
 * POST /api/leads/bulk
 * Perform bulk operations on leads
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/leads/bulk',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const body = await request.json();

  // Validate with Zod
  const parseResult = bulkOperationSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  const { operation, leadIds, data } = parseResult.data;

  switch (operation) {
    case 'update': {
      if (!data) {
        return ErrorResponses.badRequest('data is required for update operation');
      }

      // Validate status if provided
      if (
        data.status &&
        !VALID_LEAD_STATUSES.includes(data.status as (typeof VALID_LEAD_STATUSES)[number])
      ) {
        return ErrorResponses.badRequest(
          `status must be one of: ${VALID_LEAD_STATUSES.join(', ')}`
        );
      }

      // Validate temperature if provided
      if (
        data.temperature &&
        !VALID_LEAD_TEMPERATURES.includes(
          data.temperature as (typeof VALID_LEAD_TEMPERATURES)[number]
        )
      ) {
        return ErrorResponses.badRequest(
          `temperature must be one of: ${VALID_LEAD_TEMPERATURES.join(', ')}`
        );
      }

      const result = await leadsClient.bulkUpdate(leadIds, data);
      return NextResponse.json({ operation: 'update', result });
    }

    case 'delete': {
      const result = await leadsClient.bulkDelete(leadIds);
      return NextResponse.json({ operation: 'delete', result });
    }

    case 'addTag': {
      if (!data?.tagId || typeof data.tagId !== 'string') {
        return ErrorResponses.badRequest('data.tagId is required for addTag operation');
      }

      const result = await leadsClient.bulkAddTag(leadIds, data.tagId as string);
      return NextResponse.json({ operation: 'addTag', result });
    }

    case 'removeTag': {
      if (!data?.tagId || typeof data.tagId !== 'string') {
        return ErrorResponses.badRequest('data.tagId is required for removeTag operation');
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ leadId: string; error: string }>,
      };

      for (const leadId of leadIds) {
        try {
          const lead = await leadsClient.getLead(leadId);
          if (!lead) {
            results.failed++;
            results.errors.push({ leadId, error: 'Lead not found' });
            continue;
          }

          const newTags = lead.tags.filter(t => t !== data.tagId);
          await leadsClient.updateLead(leadId, { tags: newTags });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            leadId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({ operation: 'removeTag', result: results });
    }

    case 'assignTo': {
      if (!data?.userId || typeof data.userId !== 'string') {
        return ErrorResponses.badRequest('data.userId is required for assignTo operation');
      }

      const result = await leadsClient.bulkUpdate(leadIds, { assignedTo: data.userId as string });
      return NextResponse.json({ operation: 'assignTo', result });
    }

    default:
      return ErrorResponses.badRequest('Unknown operation');
  }
});
