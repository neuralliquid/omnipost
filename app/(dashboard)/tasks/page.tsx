'use client';

/**
 * Task Board Page
 * Kanban-style task management board powered by phoenix-flow MCP.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import styles from '@/styles/Tasks.module.css';
import type {
  Task,
  Project,
  CreateTaskInput,
} from '@/lib/integrations/phoenix-flow';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = Task['status'];
type TaskPriority = Task['priority'];

interface TasksApiResponse {
  tasks: Task[];
  error?: string;
}

interface ProjectsApiResponse {
  projects: Project[];
  error?: string;
}

interface CreateTaskResponse {
  task: Task;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLUMNS: Array<{ key: TaskStatus; label: string; className: string }> = [
  { key: 'todo', label: 'To Do', className: styles.columnTodo },
  { key: 'in_progress', label: 'In Progress', className: styles.columnInProgress },
  { key: 'done', label: 'Done', className: styles.columnDone },
  { key: 'blocked', label: 'Blocked', className: styles.columnBlocked },
];

const PRIORITY_STYLE_MAP: Record<TaskPriority, string> = {
  low: styles.priorityLow,
  medium: styles.priorityMedium,
  high: styles.priorityHigh,
  critical: styles.priorityCritical,
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TaskCard({ task }: { task: Task }) {
  const checklistTotal = task.checklist?.length ?? 0;
  const checklistDone = task.checklist?.filter((c) => c.done).length ?? 0;
  const progressPercent =
    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  return (
    <div className={styles.card} tabIndex={0} role="article" aria-label={task.title}>
      <h3 className={styles.cardTitle}>{task.title}</h3>
      <div className={styles.cardMeta}>
        <span className={`${styles.priorityBadge} ${PRIORITY_STYLE_MAP[task.priority]}`}>
          {task.priority}
        </span>
        {task.assignee && <span className={styles.assignee}>{task.assignee}</span>}
      </div>
      {checklistTotal > 0 && (
        <div className={styles.checklistProgress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span>
            {checklistDone}/{checklistTotal}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  className,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  className: string;
  tasks: Task[];
}) {
  const columnTasks = tasks.filter((t) => t.status === status);

  return (
    <div className={`${styles.column} ${className}`}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{label}</span>
        <span className={styles.columnCount}>{columnTasks.length}</span>
      </div>
      <div className={styles.cardList}>
        {columnTasks.length === 0 ? (
          <div className={styles.emptyColumn}>No tasks</div>
        ) : (
          columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const input: CreateTaskInput = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      status: (formData.get('status') as TaskStatus) || 'todo',
      priority: (formData.get('priority') as TaskPriority) || 'medium',
      assignee: (formData.get('assignee') as string) || undefined,
      projectId: formData.get('projectId') as string,
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data: CreateTaskResponse = await res.json();
        setError(data.error ?? 'Failed to create task');
        return;
      }

      const data: CreateTaskResponse = await res.json();
      onCreated(data.task);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create Task"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create Task</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                name="title"
                type="text"
                required
                maxLength={500}
                placeholder="Task title"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                name="description"
                maxLength={5000}
                placeholder="Optional description"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-project">Project *</label>
              <select id="task-project" name="projectId" required>
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-status">Status</label>
              <select id="task-status" name="status" defaultValue="todo">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-assignee">Assignee</label>
              <input
                id="task-assignee"
                name="assignee"
                type="text"
                maxLength={200}
                placeholder="Optional assignee"
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterProject) params.set('projectId', filterProject);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data: TasksApiResponse = await res.json();

      if (res.status === 503) {
        setError(data.error ?? 'Task management service is unavailable');
        setTasks([]);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to load tasks');
        return;
      }

      setTasks(data.tasks);
      setError(null);
    } catch {
      setError('Failed to connect to task management service');
    }
  }, [filterProject, filterStatus]);

  const fetchProjects = useCallback(async () => {
    try {
      // Projects are fetched via the tasks listing context;
      // a dedicated endpoint would be ideal but we work with
      // what the current API surface provides.
      const res = await fetch('/api/tasks?status=');
      if (res.status === 503) {
        // Service unavailable -- projects will be empty
        return;
      }
      // For now, projects come from a separate future endpoint.
      // We initialize with empty and let users type project IDs.
    } catch {
      // Silently fail -- projects are optional for display
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchProjects()]);
      setLoading(false);
    };
    void load();
  }, [fetchTasks, fetchProjects]);

  // Client-side assignee filter
  const filteredTasks = filterAssignee
    ? tasks.filter((t) => t.assignee?.toLowerCase().includes(filterAssignee.toLowerCase()))
    : tasks;

  // Extract unique assignees from loaded tasks
  const assignees = Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))) as string[];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Task Board</h1>
        </div>
        <div className={styles.unavailable}>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Task Board</h1>
        </div>
        <div className={styles.unavailable}>
          <h2>Service Unavailable</h2>
          <p>{error}</p>
          <p>
            Phoenix-Flow task management is not configured or the service is currently
            unreachable. Enable it via the phoenixFlow feature flag and configure the
            PHOENIX_FLOW_MCP_URL environment variable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Task Board</h1>
        <div className={styles.toolbar}>
          <select
            className={styles.filterSelect}
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {STATUS_COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="">All Assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            + Create Task
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.board}>
        {STATUS_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            status={col.key}
            label={col.label}
            className={col.className}
            tasks={filteredTasks}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreated={(task) => {
            setTasks((prev) => [...prev, task]);
          }}
        />
      )}
    </div>
  );
}
