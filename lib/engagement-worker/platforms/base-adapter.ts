/**
 * Base Platform Adapter
 * Shared functionality for all platform adapters
 */

import {
  SocialAccount,
  EngagementTask,
  TaskExecutionResult,
  EngagementAction,
  BehavioralEvent,
} from '../types';
import { randomInRange as randomInRangeUtil } from '../random-utils';

/**
 * Base adapter configuration
 */
export interface BaseAdapterConfig {
  fetchTimeoutMs: number;
}

const DEFAULT_CONFIG: BaseAdapterConfig = {
  fetchTimeoutMs: 30000, // 30 seconds
};

/**
 * Base Platform Adapter
 * Provides common functionality for Twitter and Facebook adapters
 */
export abstract class BasePlatformAdapter {
  protected readonly config: BaseAdapterConfig;

  constructor(config?: Partial<BaseAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make a fetch request with timeout
   */
  protected async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Random number in range
   */
  protected randomInRange(min: number, max: number): number {
    return randomInRangeUtil(min, max);
  }

  /**
   * Create an abandoned task result
   */
  protected createAbandonedResult(
    task: EngagementTask,
    account: SocialAccount,
    startedAt: string,
    events: BehavioralEvent[]
  ): TaskExecutionResult {
    const completedAt = new Date().toISOString();

    events.push({
      timestamp: completedAt,
      type: 'abandoned',
      details: { action: task.action },
    });

    return {
      taskId: task.id,
      accountId: account.id,
      success: false,
      execution: {
        action: task.action,
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      },
      behavioralEvents: events,
      error: {
        code: 'ABANDONED',
        message: 'Action was abandoned (human-like behavior)',
        retryable: true,
      },
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    task: EngagementTask,
    account: SocialAccount,
    startedAt: string,
    events: BehavioralEvent[],
    error: unknown,
    defaultErrorCode: string
  ): TaskExecutionResult {
    const completedAt = new Date().toISOString();
    const err = error as Error & { code?: string; retryable?: boolean; status?: number };

    return {
      taskId: task.id,
      accountId: account.id,
      success: false,
      execution: {
        action: task.action,
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      },
      behavioralEvents: events,
      error: {
        code: err.code || defaultErrorCode,
        message: err.message || 'Unknown error',
        retryable: err.retryable ?? err.status === 429,
      },
    };
  }

  /**
   * Get authorization headers for API requests
   */
  protected getHeaders(account: SocialAccount): Record<string, string> {
    return {
      Authorization: `Bearer ${account.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Check if an action is supported by this adapter
   */
  abstract isActionSupported(action: EngagementAction): boolean;
}
