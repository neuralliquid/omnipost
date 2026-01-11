/**
 * Facebook Platform Adapter
 * Handles Facebook Graph API interactions for engagement automation
 */

import {
  SocialAccount,
  EngagementTask,
  TaskExecutionResult,
  EngagementAction,
  BehavioralEvent,
  FacebookReaction,
} from '../types';
import { HumanSimulator } from '../human-simulator';
import { shouldOccur } from '../random-utils';
import { BasePlatformAdapter } from './base-adapter';

/**
 * Facebook API response types
 */
interface FacebookReactionResponse {
  success: boolean;
}

interface FacebookCommentResponse {
  id: string;
}

interface FacebookShareResponse {
  id: string;
  post_id: string;
}

interface FacebookError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Facebook reaction type mapping to API values
 */
const REACTION_MAP: Record<FacebookReaction, string> = {
  like: 'LIKE',
  love: 'LOVE',
  haha: 'HAHA',
  wow: 'WOW',
  sad: 'SAD',
  angry: 'ANGRY',
};

/**
 * Facebook Platform Adapter
 */
export class FacebookAdapter extends BasePlatformAdapter {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Execute an engagement action
   */
  async execute(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator
  ): Promise<TaskExecutionResult> {
    const startedAt = new Date().toISOString();
    const events: BehavioralEvent[] = [];

    try {
      // Pre-action delay (reading/thinking)
      const preDelay = await simulator.generatePreActionDelay();
      await this.delay(preDelay);
      events.push(...simulator.getEvents());
      simulator.clearEvents();

      // Check for abandonment
      if (simulator.shouldAbandon('before_typing')) {
        return this.createAbandonedResult(task, account, startedAt, events);
      }

      // Execute based on action type
      let result: TaskExecutionResult;

      switch (task.action) {
        case 'like':
        case 'react':
          result = await this.executeReaction(account, task, simulator, startedAt, events);
          break;
        case 'comment':
        case 'reply':
          result = await this.executeComment(account, task, simulator, startedAt, events);
          break;
        case 'share':
          result = await this.executeShare(account, task, simulator, startedAt, events);
          break;
        default:
          throw new Error(`Unsupported action for Facebook: ${task.action}`);
      }

      return result;
    } catch (error) {
      return this.createErrorResult(task, account, startedAt, events, error, 'FACEBOOK_ERROR');
    }
  }

  /**
   * Execute a reaction (like, love, etc.)
   */
  private async executeReaction(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    // Determine reaction type
    let reaction: FacebookReaction = task.reaction || 'like';

    // Simulate reaction changes (user hovering over different reactions)
    const reactionChanges = simulator.simulateReactionChanges();
    if (reactionChanges.changed) {
      events.push({
        timestamp: new Date().toISOString(),
        type: 'changed_reaction',
        details: {
          changes: reactionChanges.changes,
          finalReaction: reaction,
        },
      });

      // Simulate time spent hovering over reactions
      await this.delay(this.randomInRange(500, 2000));

      // Maybe change to a different reaction
      if (reactionChanges.changes.length > 0 && shouldOccur(0.3)) {
        reaction = reactionChanges.changes[reactionChanges.changes.length - 1] as FacebookReaction;
      }
    }

    // Simulate hover before click
    const hoverDelay = this.randomInRange(200, 600);
    await this.delay(hoverDelay);

    // Hesitation check
    const hesitation = await simulator.simulateHesitation();
    if (hesitation.hesitated) {
      await this.delay(hesitation.duration);
      events.push({
        timestamp: new Date().toISOString(),
        type: 'hesitated',
        details: { duration: hesitation.duration },
      });
    }

    // Make API call
    const response = await this.reactToPost(account, task.target.postId, reaction);

    const completedAt = new Date().toISOString();

    return {
      taskId: task.id,
      accountId: account.id,
      success: response.success,
      execution: {
        action: task.action,
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        platformResponse: {
          id: task.target.postId,
          reaction: reaction,
          success: response.success,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * Execute a comment action
   */
  private async executeComment(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    if (!task.content?.text) {
      throw new Error('Comment requires content text');
    }

    // Check for abandonment before typing
    if (simulator.shouldAbandon('before_typing')) {
      return this.createAbandonedResult(task, account, startedAt, events);
    }

    // Click on comment box (simulate)
    await this.delay(this.randomInRange(300, 800));
    events.push({
      timestamp: new Date().toISOString(),
      type: 'started_typing',
      details: { action: 'comment' },
    });

    // Simulate typing with human-like behavior
    const typingResult = await simulator.simulateTyping(task.content.text);
    events.push(...simulator.getEvents());
    simulator.clearEvents();

    // Simulate actual typing time
    await this.delay(typingResult.totalDurationMs);

    // Check for abandonment mid-typing
    if (simulator.shouldAbandon('mid_typing')) {
      events.push({
        timestamp: new Date().toISOString(),
        type: 'abandoned',
        details: {
          stage: 'mid_typing',
          textLength: typingResult.finalText.length,
        },
      });
      return this.createAbandonedResult(task, account, startedAt, events);
    }

    // Final hesitation before submit
    const hesitation = await simulator.simulateHesitation();
    if (hesitation.hesitated) {
      await this.delay(hesitation.duration);
      events.push({
        timestamp: new Date().toISOString(),
        type: 'hesitated',
        details: { duration: hesitation.duration },
      });

      // Last chance to abandon
      if (simulator.shouldAbandon('before_submit')) {
        return this.createAbandonedResult(task, account, startedAt, events);
      }
    }

    // Make API call
    const finalText = task.content.withErrors ? typingResult.finalText : task.content.text;
    const response = await this.commentOnPost(account, task.target.postId, finalText);

    events.push({
      timestamp: new Date().toISOString(),
      type: 'submitted',
      details: { textLength: finalText.length },
    });

    const completedAt = new Date().toISOString();

    return {
      taskId: task.id,
      accountId: account.id,
      success: true,
      execution: {
        action: task.action,
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        sentContent: finalText,
        errorsIntroduced: typingResult.errors,
        platformResponse: {
          id: response.id,
          url: `https://www.facebook.com/${response.id}`,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * Execute a share action
   */
  private async executeShare(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    // Sharing requires more thought - longer delays
    const thinkDelay = this.randomInRange(2000, 5000);
    await this.delay(thinkDelay);

    // Higher chance of second thoughts for shares (public commitment)
    if (shouldOccur(0.15)) {
      events.push({
        timestamp: new Date().toISOString(),
        type: 'had_second_thoughts',
        details: { action: 'share' },
      });

      // 60% chance to actually abandon
      if (shouldOccur(0.6)) {
        return this.createAbandonedResult(task, account, startedAt, events);
      }
    }

    // Check for optional share message
    let shareMessage: string | undefined;
    if (task.content?.text) {
      const typingResult = await simulator.simulateTyping(task.content.text);
      await this.delay(typingResult.totalDurationMs);
      shareMessage = task.content.withErrors ? typingResult.finalText : task.content.text;
      events.push(...simulator.getEvents());
      simulator.clearEvents();
    }

    // Make API call
    const response = await this.sharePost(account, task.target.postId, shareMessage);

    const completedAt = new Date().toISOString();

    return {
      taskId: task.id,
      accountId: account.id,
      success: true,
      execution: {
        action: 'share',
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        sentContent: shareMessage,
        platformResponse: {
          id: response.id,
          post_id: response.post_id,
          url: `https://www.facebook.com/${response.post_id}`,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * React to a post via API
   */
  private async reactToPost(
    account: SocialAccount,
    postId: string,
    reaction: FacebookReaction
  ): Promise<FacebookReactionResponse> {
    const url = `${this.baseUrl}/${postId}/reactions`;

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify({
        type: REACTION_MAP[reaction],
      }),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  /**
   * Comment on a post via API
   */
  private async commentOnPost(
    account: SocialAccount,
    postId: string,
    message: string
  ): Promise<FacebookCommentResponse> {
    const url = `${this.baseUrl}/${postId}/comments`;

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  /**
   * Share a post via API
   */
  private async sharePost(
    account: SocialAccount,
    postId: string,
    message?: string
  ): Promise<FacebookShareResponse> {
    const url = `${this.baseUrl}/me/feed`;

    const body: Record<string, string> = {
      link: `https://www.facebook.com/${postId}`,
    };

    if (message) {
      body.message = message;
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    const data = await response.json();
    return {
      id: data.id,
      post_id: data.id,
    };
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<Error> {
    let errorData: FacebookError;

    try {
      errorData = await response.json();
    } catch {
      return new Error(`Facebook API error: ${response.status} ${response.statusText}`);
    }

    const error = new Error(errorData.error?.message || 'Facebook API error') as Error & {
      code: string;
      status: number;
      retryable: boolean;
      subcode?: number;
    };

    error.code = errorData.error?.type || 'FACEBOOK_ERROR';
    error.status = response.status;
    error.subcode = errorData.error?.error_subcode;

    // Determine if retryable
    const retryableCodes = [1, 2, 17, 341]; // Temporary issues, rate limits
    error.retryable =
      response.status === 429 ||
      response.status >= 500 ||
      retryableCodes.includes(errorData.error?.code || 0);

    return error;
  }

  /**
   * Validate action is supported
   */
  isActionSupported(action: EngagementAction): boolean {
    return ['like', 'react', 'comment', 'reply', 'share'].includes(action);
  }

  /**
   * Get available reactions
   */
  getAvailableReactions(): FacebookReaction[] {
    return ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
  }
}

// Singleton instance
let facebookAdapter: FacebookAdapter | null = null;

export function getFacebookAdapter(): FacebookAdapter {
  if (!facebookAdapter) {
    facebookAdapter = new FacebookAdapter();
  }
  return facebookAdapter;
}
