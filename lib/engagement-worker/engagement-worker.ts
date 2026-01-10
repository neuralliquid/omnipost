/**
 * Engagement Worker Service
 * Main orchestration service for multi-account engagement with human-like behavior
 */

import {
  EngagementWorkerConfig,
  DEFAULT_WORKER_CONFIG,
  WorkerStatus,
  WorkerStats,
  EngagementTask,
  TaskStatus,
  TaskExecutionResult,
  Platform,
  SocialAccount,
} from './types';
import { AccountManager, getAccountManager } from './account-manager';
import { HumanSimulator } from './human-simulator';
import { TwitterAdapter, getTwitterAdapter } from './platforms/twitter';
import { FacebookAdapter, getFacebookAdapter } from './platforms/facebook';

/**
 * Task queue for pending tasks
 */
interface TaskQueue {
  tasks: Map<string, EngagementTask>;
  add(task: EngagementTask): void;
  get(taskId: string): EngagementTask | undefined;
  update(taskId: string, updates: Partial<EngagementTask>): void;
  remove(taskId: string): void;
  getPending(limit?: number): EngagementTask[];
  getByAccount(accountId: string): EngagementTask[];
  getByStatus(status: TaskStatus): EngagementTask[];
}

/**
 * In-memory task queue implementation
 */
class InMemoryTaskQueue implements TaskQueue {
  tasks: Map<string, EngagementTask> = new Map();

  add(task: EngagementTask): void {
    this.tasks.set(task.id, task);
  }

  get(taskId: string): EngagementTask | undefined {
    return this.tasks.get(taskId);
  }

  update(taskId: string, updates: Partial<EngagementTask>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    }
  }

  remove(taskId: string): void {
    this.tasks.delete(taskId);
  }

  getPending(limit?: number): EngagementTask[] {
    const pending = Array.from(this.tasks.values())
      .filter((t) => t.status === 'pending' || t.status === 'scheduled')
      .sort((a, b) => {
        // Priority first
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by scheduled time
        if (a.scheduledAt && b.scheduledAt) {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        }

        // Then by creation time
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    return limit ? pending.slice(0, limit) : pending;
  }

  getByAccount(accountId: string): EngagementTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.accountId === accountId);
  }

  getByStatus(status: TaskStatus): EngagementTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }
}

/**
 * Engagement Worker Service
 * Orchestrates multi-account engagement with human-like behavior
 */
export class EngagementWorker {
  private readonly config: EngagementWorkerConfig;
  private readonly accountManager: AccountManager;
  private readonly taskQueue: TaskQueue;
  private readonly twitterAdapter: TwitterAdapter;
  private readonly facebookAdapter: FacebookAdapter;

  private status: WorkerStatus = 'idle';
  private startedAt?: string;
  private processingInterval?: ReturnType<typeof setInterval>;
  private activeTasks: Set<string> = new Set();

  // Statistics
  private stats = {
    actionsToday: 0,
    actionsThisHour: 0,
    totalActions: 0,
    successCount: 0,
    failureCount: 0,
    abandonedCount: 0,
    errorsIntroduced: 0,
    errorsCorrected: 0,
    hourResetAt: new Date(Date.now() + 3600000).toISOString(),
    dayResetAt: this.getNextMidnight().toISOString(),
  };

  constructor(config?: Partial<EngagementWorkerConfig>) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...config };
    this.accountManager = getAccountManager();
    this.taskQueue = new InMemoryTaskQueue();
    this.twitterAdapter = getTwitterAdapter();
    this.facebookAdapter = getFacebookAdapter();
  }

  /**
   * Start the worker
   */
  start(): void {
    if (this.status === 'running') {
      console.log('Worker is already running');
      return;
    }

    this.status = 'running';
    this.startedAt = new Date().toISOString();

    console.log('Engagement worker started');

    // Start processing loop
    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.config.taskCheckIntervalMs
    );

    // Initial processing
    this.processQueue();
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.status = 'stopped';
    console.log('Engagement worker stopped');
  }

  /**
   * Pause the worker
   */
  pause(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.status = 'paused';
    console.log('Engagement worker paused');
  }

  /**
   * Resume the worker
   */
  resume(): void {
    if (this.status !== 'paused') {
      console.log('Worker is not paused');
      return;
    }

    this.status = 'running';

    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.config.taskCheckIntervalMs
    );

    console.log('Engagement worker resumed');
  }

  /**
   * Add a task to the queue
   */
  addTask(task: Omit<EngagementTask, 'id' | 'createdAt' | 'updatedAt' | 'attempts'>): string {
    const now = new Date().toISOString();
    const taskId = this.generateTaskId();

    const fullTask: EngagementTask = {
      ...task,
      id: taskId,
      status: task.scheduledAt ? 'scheduled' : 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.taskQueue.add(fullTask);
    return taskId;
  }

  /**
   * Add multiple tasks
   */
  addTasks(
    tasks: Omit<EngagementTask, 'id' | 'createdAt' | 'updatedAt' | 'attempts'>[]
  ): string[] {
    return tasks.map((task) => this.addTask(task));
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.taskQueue.get(taskId);
    if (!task) return false;

    if (this.activeTasks.has(taskId)) {
      // Can't cancel executing tasks
      return false;
    }

    this.taskQueue.remove(taskId);
    return true;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): EngagementTask | undefined {
    return this.taskQueue.get(taskId);
  }

  /**
   * Get worker statistics
   */
  getStats(): WorkerStats {
    this.resetStatsIfNeeded();

    const accountStats = this.accountManager.getStats();

    return {
      status: this.status,
      startedAt: this.startedAt,
      uptime: this.startedAt
        ? Date.now() - new Date(this.startedAt).getTime()
        : 0,

      actionsToday: this.stats.actionsToday,
      actionsThisHour: this.stats.actionsThisHour,
      totalActions: this.stats.totalActions,

      successRate: this.stats.totalActions > 0
        ? this.stats.successCount / this.stats.totalActions
        : 0,
      failureRate: this.stats.totalActions > 0
        ? this.stats.failureCount / this.stats.totalActions
        : 0,

      pendingTasks: this.taskQueue.getByStatus('pending').length +
        this.taskQueue.getByStatus('scheduled').length,
      processingTasks: this.activeTasks.size,
      completedToday: this.stats.successCount,
      failedToday: this.stats.failureCount,

      activeAccounts: accountStats.active,
      pausedAccounts: accountStats.paused,
      rateLimitedAccounts: accountStats.rateLimited,

      errorsIntroduced: this.stats.errorsIntroduced,
      errorsCorrected: this.stats.errorsCorrected,
      actionsAbandoned: this.stats.abandonedCount,
    };
  }

  /**
   * Get the account manager
   */
  getAccountManager(): AccountManager {
    return this.accountManager;
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    if (this.status !== 'running') return;

    this.resetStatsIfNeeded();

    // Check global rate limits
    if (this.stats.actionsThisHour >= this.config.globalActionsPerHour) {
      console.log('Global hourly rate limit reached');
      return;
    }

    if (this.stats.actionsToday >= this.config.globalActionsPerDay) {
      console.log('Global daily rate limit reached');
      return;
    }

    // Get pending tasks
    const pendingTasks = this.taskQueue.getPending(this.config.maxConcurrentTasks);
    if (pendingTasks.length === 0) return;

    // Process tasks
    for (const task of pendingTasks) {
      // Check if we can process more
      if (this.activeTasks.size >= this.config.maxConcurrentTasks) break;

      // Check scheduled time
      if (task.scheduledAt) {
        const scheduledTime = new Date(task.scheduledAt).getTime();
        if (Date.now() < scheduledTime) continue;
      }

      // Get available account
      const account = this.accountManager.getAccount(task.accountId);
      if (!account || !this.accountManager.isAccountAvailable(account)) {
        // Try to reassign to another account
        const alternateAccount = this.accountManager.getNextAccount(task.platform);
        if (!alternateAccount) continue;

        this.taskQueue.update(task.id, { accountId: alternateAccount.id });
        task.accountId = alternateAccount.id;
      }

      // Execute task
      this.executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: EngagementTask): Promise<void> {
    const account = this.accountManager.getAccount(task.accountId);
    if (!account) return;

    this.activeTasks.add(task.id);
    this.taskQueue.update(task.id, { status: 'executing', attempts: task.attempts + 1 });

    try {
      // Create simulator with account's behavior profile
      const simulator = new HumanSimulator(
        account.behaviorProfile,
        task.behaviorOverrides
      );

      // Check if good time to engage
      const timing = simulator.isGoodTimeToEngage();
      if (!timing.shouldEngage && timing.waitMs) {
        // Reschedule for later
        const newScheduledTime = new Date(Date.now() + timing.waitMs).toISOString();
        this.taskQueue.update(task.id, {
          status: 'scheduled',
          scheduledAt: newScheduledTime,
        });
        this.activeTasks.delete(task.id);
        return;
      }

      // Add natural delay between actions
      const interActionDelay = this.randomInRange(
        this.config.minDelayBetweenActionsMs,
        this.config.maxDelayBetweenActionsMs
      );
      await this.delay(interActionDelay);

      // Execute based on platform
      let result: TaskExecutionResult;

      switch (task.platform) {
        case 'twitter':
          if (!this.config.enableTwitter) {
            throw new Error('Twitter is disabled');
          }
          result = await this.twitterAdapter.execute(account, task, simulator);
          break;

        case 'facebook':
          if (!this.config.enableFacebook) {
            throw new Error('Facebook is disabled');
          }
          result = await this.facebookAdapter.execute(account, task, simulator);
          break;

        default:
          throw new Error(`Unsupported platform: ${task.platform}`);
      }

      // Update statistics
      this.updateStats(result);

      // Update account rate limits
      this.accountManager.recordAction(account.id, result.success);

      // Update task status
      if (result.success) {
        this.taskQueue.update(task.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      } else if (result.error?.code === 'ABANDONED') {
        this.taskQueue.update(task.id, {
          status: 'abandoned',
          error: result.error.message,
        });
      } else if (result.error?.retryable && task.attempts < task.maxAttempts) {
        // Schedule retry
        const retryDelay = this.calculateRetryDelay(task.attempts);
        this.taskQueue.update(task.id, {
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + retryDelay).toISOString(),
          lastAttemptAt: new Date().toISOString(),
          error: result.error.message,
        });
      } else {
        this.taskQueue.update(task.id, {
          status: 'failed',
          error: result.error?.message || 'Unknown error',
        });
      }

      // Handle rate limiting
      if (result.error?.code === 'RATE_LIMITED' || result.error?.code === 'TWITTER_ERROR') {
        const resetMs = 15 * 60 * 1000; // 15 minutes default
        this.accountManager.setRateLimited(account.id, resetMs);
      }
    } catch (error) {
      console.error(`Task execution error: ${task.id}`, error);

      this.taskQueue.update(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.stats.failureCount++;
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Update statistics based on execution result
   */
  private updateStats(result: TaskExecutionResult): void {
    this.stats.totalActions++;
    this.stats.actionsToday++;
    this.stats.actionsThisHour++;

    if (result.success) {
      this.stats.successCount++;
    } else if (result.error?.code === 'ABANDONED') {
      this.stats.abandonedCount++;
    } else {
      this.stats.failureCount++;
    }

    // Track errors introduced
    if (result.execution.errorsIntroduced) {
      const uncorrectedErrors = result.execution.errorsIntroduced.filter(
        (e) => !e.corrected
      ).length;
      const correctedErrors = result.execution.errorsIntroduced.filter(
        (e) => e.corrected
      ).length;

      this.stats.errorsIntroduced += uncorrectedErrors;
      this.stats.errorsCorrected += correctedErrors;
    }
  }

  /**
   * Reset statistics if time windows have passed
   */
  private resetStatsIfNeeded(): void {
    const now = new Date();

    // Check hourly reset
    if (now >= new Date(this.stats.hourResetAt)) {
      this.stats.actionsThisHour = 0;
      this.stats.hourResetAt = new Date(now.getTime() + 3600000).toISOString();
    }

    // Check daily reset
    if (now >= new Date(this.stats.dayResetAt)) {
      this.stats.actionsToday = 0;
      this.stats.successCount = 0;
      this.stats.failureCount = 0;
      this.stats.abandonedCount = 0;
      this.stats.dayResetAt = this.getNextMidnight().toISOString();
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempts: number): number {
    const baseDelay = 60000; // 1 minute
    const maxDelay = 3600000; // 1 hour

    const delay = baseDelay * Math.pow(2, attempts);
    const jitter = Math.random() * 0.3 * delay; // 30% jitter

    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Get next midnight for daily reset
   */
  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Random number in range
   */
  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Singleton instance
let engagementWorker: EngagementWorker | null = null;

/**
 * Get or create the engagement worker instance
 */
export function getEngagementWorker(
  config?: Partial<EngagementWorkerConfig>
): EngagementWorker {
  if (!engagementWorker) {
    engagementWorker = new EngagementWorker(config);
  }
  return engagementWorker;
}

/**
 * Create a new engagement worker instance (for testing)
 */
export function createEngagementWorker(
  config?: Partial<EngagementWorkerConfig>
): EngagementWorker {
  return new EngagementWorker(config);
}
