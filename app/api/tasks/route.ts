/**
 * Tasks API Routes
 * GET  - List tasks from phoenix-flow MCP
 * POST - Create a new task via phoenix-flow MCP
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkAuthAndRateLimit, withErrorHandling } from '@/app/api/_utils/middleware';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { sanitizeText } from '@/app/api/_utils/sanitize';
import { getTasks, createTask, PhoenixFlowUnavailableError } from '@/lib/integrations/phoenix-flow';

// Valid status and priority values
const VALID_TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'] as const;
const VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

// Zod schema for creating a task
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be at most 500 characters')
    .transform(sanitizeText),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .transform(sanitizeText)
    .optional(),
  status: z.enum(VALID_TASK_STATUSES).default('todo'),
  assignee: z.string().max(200).transform(sanitizeText).optional(),
  priority: z.enum(VALID_TASK_PRIORITIES).default('medium'),
  projectId: z.string().min(1, 'Project ID is required'),
  checklist: z
    .array(
      z.object({
        text: z.string().min(1).max(500).transform(sanitizeText),
        done: z.boolean(),
      })
    )
    .optional(),
});

/**
 * GET /api/tasks
 * List tasks with optional filters
 */
export const GET = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/tasks',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  // Validate status filter if provided
  if (status && !VALID_TASK_STATUSES.includes(status as (typeof VALID_TASK_STATUSES)[number])) {
    return ErrorResponses.badRequest(`status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  try {
    const tasks = await getTasks(projectId, status);
    return NextResponse.json({ tasks });
  } catch (error: unknown) {
    if (error instanceof PhoenixFlowUnavailableError) {
      return NextResponse.json(
        { error: 'Task management service is unavailable', tasks: [] },
        { status: 503 }
      );
    }
    throw error;
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
export const POST = withErrorHandling(async (request: Request) => {
  const nextRequest = request as NextRequest;

  const checkError = await checkAuthAndRateLimit(
    nextRequest,
    '/api/tasks',
    RateLimitPresets.GENERAL
  );
  if (checkError) return checkError;

  const body: unknown = await request.json();

  // Validate with Zod
  const parseResult = createTaskSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`
    );
    return ErrorResponses.badRequest(errors.join('; '));
  }

  try {
    const task = await createTask(parseResult.data);
    return NextResponse.json({ task }, { status: 201 });
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
