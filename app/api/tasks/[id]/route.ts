/**
 * Single Task API Routes
 * GET   - Get task details (by filtering from phoenix-flow)
 * PATCH - Update a task via phoenix-flow MCP
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkAuthAndRateLimit, withErrorHandling } from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';
import { getTasks, updateTask, PhoenixFlowUnavailableError } from '@/lib/integrations/phoenix-flow';

const VALID_TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'] as const;
const VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

// Zod schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).transform(sanitizeText).optional(),
  description: z.string().max(5000).transform(sanitizeText).optional(),
  status: z.enum(VALID_TASK_STATUSES).optional(),
  assignee: z.string().max(200).transform(sanitizeText).optional(),
  priority: z.enum(VALID_TASK_PRIORITIES).optional(),
  checklist: z
    .array(
      z.object({
        text: z.string().min(1).max(500).transform(sanitizeText),
        done: z.boolean(),
      })
    )
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export const GET = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/tasks/[id]',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;

  try {
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return ErrorResponses.notFound('Task');
    }

    return NextResponse.json({ task });
  } catch (error: unknown) {
    if (error instanceof PhoenixFlowUnavailableError) {
      return NextResponse.json(
        { error: 'Task management service is unavailable' },
        { status: 503 }
      );
    }
    throw error;
  }
});

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/tasks/[id]',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { id } = await params;
  const body: unknown = await request.json();

  // Validate with Zod
  const parseResult = updateTaskSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  try {
    const task = await updateTask(id, parseResult.data);
    return NextResponse.json({ task });
  } catch (error: unknown) {
    if (error instanceof PhoenixFlowUnavailableError) {
      return NextResponse.json(
        { error: 'Task management service is unavailable' },
        { status: 503 }
      );
    }
    throw error;
  }
});
