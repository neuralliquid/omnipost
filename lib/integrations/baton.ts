/**
 * Baton MCP Client Integration
 *
 * Connects to baton's MCP server for task management
 * with Portfolio -> Project -> Task hierarchy.
 * Baton proxies org-level data from mcp-org.
 *
 * Note: baton is the renamed phoenixvc/phoenix-flow service.
 */

import featureFlags from '@/lib/featureFlags';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatonConfig {
  mcpUrl: string;
  mcpSecret: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  checklist?: Array<{ text: string; done: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  taskCount: number;
}

export interface OrgHealth {
  totalProjects: number;
  totalTasks: number;
  completionRate: number;
  blockedTasks: number;
}

export interface OrgRoadmap {
  milestones: Array<{
    id: string;
    title: string;
    dueDate?: string;
    status: string;
  }>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Task['status'];
  assignee?: string;
  priority?: Task['priority'];
  projectId: string;
  checklist?: Array<{ text: string; done: boolean }>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  assignee?: string;
  priority?: Task['priority'];
  checklist?: Array<{ text: string; done: boolean }>;
}

interface McpToolResult<T> {
  result: T;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 10_000;

function getConfig(): BatonConfig | null {
  const baton = featureFlags.baton as { enabled: boolean; mcpUrl?: string } | undefined;

  if (!baton?.enabled) {
    return null;
  }

  const mcpUrl = baton.mcpUrl || process.env.BATON_MCP_URL;
  const mcpSecret = process.env.BATON_MCP_SECRET;

  if (!mcpUrl || !mcpSecret) {
    return null;
  }

  return { mcpUrl, mcpSecret };
}

// ---------------------------------------------------------------------------
// MCP call helper
// ---------------------------------------------------------------------------

async function callMcpTool<T>(toolName: string, params: Record<string, unknown> = {}): Promise<T> {
  const config = getConfig();
  if (!config) {
    throw new BatonUnavailableError('Baton integration is not configured or disabled');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.mcpUrl}/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.mcpSecret}`,
      },
      body: JSON.stringify({ params }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Baton MCP call "${toolName}" failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as McpToolResult<T>;
    return data.result;
  } catch (error: unknown) {
    if (error instanceof BatonUnavailableError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new BatonUnavailableError(
        `Baton MCP call "${toolName}" timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    throw new BatonUnavailableError(
      `Baton MCP call "${toolName}" failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class BatonUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BatonUnavailableError';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all projects from baton.
 */
export async function listProjects(): Promise<Project[]> {
  return callMcpTool<Project[]>('list_projects');
}

/**
 * Get tasks with optional project and status filters.
 */
export async function getTasks(projectId?: string, status?: string): Promise<Task[]> {
  const params: Record<string, unknown> = {};
  if (projectId) params.projectId = projectId;
  if (status) params.status = status;
  return callMcpTool<Task[]>('get_tasks', params);
}

/**
 * Create a new task.
 */
export async function createTask(task: CreateTaskInput): Promise<Task> {
  return callMcpTool<Task>('create_task', task as unknown as Record<string, unknown>);
}

/**
 * Update an existing task.
 */
export async function updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
  return callMcpTool<Task>('update_task', {
    taskId,
    ...updates,
  });
}

/**
 * Get organizational roadmap (proxied from mcp-org).
 */
export async function getOrgRoadmap(): Promise<OrgRoadmap> {
  return callMcpTool<OrgRoadmap>('get_org_roadmap');
}

/**
 * Get organizational health metrics (proxied from mcp-org).
 */
export async function getOrgHealth(): Promise<OrgHealth> {
  return callMcpTool<OrgHealth>('get_org_health');
}

/**
 * Trigger YAML sync for task state persistence.
 */
export async function syncToYaml(): Promise<{ success: boolean }> {
  return callMcpTool<{ success: boolean }>('sync_to_yaml');
}

/**
 * Check whether baton is available and enabled.
 */
export function isBatonEnabled(): boolean {
  return getConfig() !== null;
}
