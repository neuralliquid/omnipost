/**
 * Lead Bulk Operations API Routes
 * POST - Perform bulk operations on leads
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import type { LeadStatus, LeadTemperature } from '@/types/lead';

// Valid status values
const VALID_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'nurturing',
];

// Valid temperature values
const VALID_TEMPERATURES: LeadTemperature[] = ['cold', 'warm', 'hot'];

// Valid bulk operations
const VALID_OPERATIONS = ['update', 'delete', 'addTag', 'removeTag', 'assignTo'] as const;
type BulkOperation = (typeof VALID_OPERATIONS)[number];

/**
 * POST /api/leads/bulk
 * Perform bulk operations on leads
 *
 * Request body:
 * {
 *   operation: 'update' | 'delete' | 'addTag' | 'removeTag' | 'assignTo',
 *   leadIds: string[],
 *   data?: { ... } // Operation-specific data
 * }
 */
export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Validate operation
    if (!body.operation) {
      return NextResponse.json({ error: 'operation is required' }, { status: 400 });
    }

    if (!VALID_OPERATIONS.includes(body.operation as BulkOperation)) {
      return NextResponse.json(
        {
          error: `operation must be one of: ${VALID_OPERATIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate leadIds
    if (!body.leadIds || !Array.isArray(body.leadIds) || body.leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds must be a non-empty array' }, { status: 400 });
    }

    // Limit bulk operations
    if (body.leadIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 leads per bulk operation' }, { status: 400 });
    }

    const operation = body.operation as BulkOperation;
    const leadIds = body.leadIds as string[];

    switch (operation) {
      case 'update': {
        if (!body.data) {
          return NextResponse.json(
            { error: 'data is required for update operation' },
            { status: 400 }
          );
        }

        // Validate update data
        if (body.data.status && !VALID_STATUSES.includes(body.data.status)) {
          return NextResponse.json(
            {
              error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
            },
            { status: 400 }
          );
        }

        if (body.data.temperature && !VALID_TEMPERATURES.includes(body.data.temperature)) {
          return NextResponse.json(
            {
              error: `temperature must be one of: ${VALID_TEMPERATURES.join(', ')}`,
            },
            { status: 400 }
          );
        }

        const result = await leadsClient.bulkUpdate(leadIds, body.data);
        return NextResponse.json({
          operation: 'update',
          result,
        });
      }

      case 'delete': {
        const result = await leadsClient.bulkDelete(leadIds);
        return NextResponse.json({
          operation: 'delete',
          result,
        });
      }

      case 'addTag': {
        if (!body.data?.tagId) {
          return NextResponse.json(
            { error: 'data.tagId is required for addTag operation' },
            { status: 400 }
          );
        }

        const result = await leadsClient.bulkAddTag(leadIds, body.data.tagId);
        return NextResponse.json({
          operation: 'addTag',
          result,
        });
      }

      case 'removeTag': {
        if (!body.data?.tagId) {
          return NextResponse.json(
            { error: 'data.tagId is required for removeTag operation' },
            { status: 400 }
          );
        }

        // Remove tag from each lead
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

            const newTags = lead.tags.filter(t => t !== body.data.tagId);
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

        return NextResponse.json({
          operation: 'removeTag',
          result: results,
        });
      }

      case 'assignTo': {
        if (!body.data?.userId) {
          return NextResponse.json(
            { error: 'data.userId is required for assignTo operation' },
            { status: 400 }
          );
        }

        const result = await leadsClient.bulkUpdate(leadIds, { assignedTo: body.data.userId });
        return NextResponse.json({
          operation: 'assignTo',
          result,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    const message = error instanceof Error ? error.message : 'Failed to perform bulk operation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
