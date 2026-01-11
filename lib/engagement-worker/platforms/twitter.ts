/**
 * Twitter Platform Adapter
 * Handles Twitter/X API interactions for engagement automation
 */

import { SocialAccount, EngagementTask, TaskExecutionResult, BehavioralEvent } from '../types';
import { HumanSimulator } from '../human-simulator';
import { shouldOccur } from '../random-utils';
import { BasePlatformAdapter } from './base-adapter';

/**
 * Twitter API response types
 */
interface TwitterLikeResponse {
  data: {
    liked: boolean;
  };
}

interface TwitterRetweetResponse {
  data: {
    retweeted: boolean;
  };
}

interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

interface TwitterError {
  title: string;
  detail: string;
  type: string;
  status: number;
}

/**
 * Twitter Platform Adapter
 */
export class TwitterAdapter extends BasePlatformAdapter {
  private readonly baseUrl = 'https://api.twitter.com/2';
  private readonly userIdCache: Map<string, { id: string; expiresAt: number }> = new Map();
  private readonly cacheExpiryMs = 3600000; // 1 hour cache

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
          result = await this.executeLike(account, task, simulator, startedAt, events);
          break;
        case 'retweet':
          result = await this.executeRetweet(account, task, simulator, startedAt, events);
          break;
        case 'comment':
        case 'reply':
          result = await this.executeReply(account, task, simulator, startedAt, events);
          break;
        default:
          throw new Error(`Unsupported action for Twitter: ${task.action}`);
      }

      return result;
    } catch (error) {
      return this.createErrorResult(task, account, startedAt, events, error, 'TWITTER_ERROR');
    }
  }

  /**
   * Execute a like action
   */
  private async executeLike(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    // Simulate hover before click
    const hoverDelay = this.randomInRange(200, 800);
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
    const response = await this.likeTweet(account, task.target.postId);

    const completedAt = new Date().toISOString();

    return {
      taskId: task.id,
      accountId: account.id,
      success: response.data.liked,
      execution: {
        action: 'like',
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        platformResponse: {
          id: task.target.postId,
          liked: response.data.liked,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * Execute a retweet action
   */
  private async executeRetweet(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    // Longer consideration time for retweets (more commitment)
    const considerDelay = this.randomInRange(1000, 3000);
    await this.delay(considerDelay);

    // Higher chance of second thoughts for retweets
    if (shouldOccur(0.1)) {
      events.push({
        timestamp: new Date().toISOString(),
        type: 'had_second_thoughts',
        details: { action: 'retweet' },
      });

      // 50% chance to actually abandon
      if (shouldOccur(0.5)) {
        return this.createAbandonedResult(task, account, startedAt, events);
      }
    }

    // Make API call
    const response = await this.retweetTweet(account, task.target.postId);

    const completedAt = new Date().toISOString();

    return {
      taskId: task.id,
      accountId: account.id,
      success: response.data.retweeted,
      execution: {
        action: 'retweet',
        startedAt,
        completedAt,
        duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        platformResponse: {
          id: task.target.postId,
          retweeted: response.data.retweeted,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * Execute a reply/comment action
   */
  private async executeReply(
    account: SocialAccount,
    task: EngagementTask,
    simulator: HumanSimulator,
    startedAt: string,
    events: BehavioralEvent[]
  ): Promise<TaskExecutionResult> {
    if (!task.content?.text) {
      throw new Error('Reply requires content text');
    }

    // Check for abandonment before typing
    if (simulator.shouldAbandon('before_typing')) {
      return this.createAbandonedResult(task, account, startedAt, events);
    }

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
        details: { stage: 'mid_typing', textLength: typingResult.finalText.length },
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
    const response = await this.replyToTweet(
      account,
      task.target.postId,
      task.content.withErrors ? typingResult.finalText : task.content.text
    );

    events.push({
      timestamp: new Date().toISOString(),
      type: 'submitted',
      details: { textLength: typingResult.finalText.length },
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
        sentContent: task.content.withErrors ? typingResult.finalText : task.content.text,
        errorsIntroduced: typingResult.errors,
        platformResponse: {
          id: response.data.id,
          url: `https://twitter.com/i/status/${response.data.id}`,
          text: response.data.text,
        },
      },
      behavioralEvents: events,
    };
  }

  /**
   * Like a tweet via API
   */
  private async likeTweet(account: SocialAccount, tweetId: string): Promise<TwitterLikeResponse> {
    const userId = await this.getUserId(account);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/users/${userId}/likes`, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify({ tweet_id: tweetId }),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  /**
   * Retweet a tweet via API
   */
  private async retweetTweet(
    account: SocialAccount,
    tweetId: string
  ): Promise<TwitterRetweetResponse> {
    const userId = await this.getUserId(account);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/users/${userId}/retweets`, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify({ tweet_id: tweetId }),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  /**
   * Reply to a tweet via API
   */
  private async replyToTweet(
    account: SocialAccount,
    tweetId: string,
    text: string
  ): Promise<TwitterTweetResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/tweets`, {
      method: 'POST',
      headers: this.getHeaders(account),
      body: JSON.stringify({
        text,
        reply: {
          in_reply_to_tweet_id: tweetId,
        },
      }),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  /**
   * Get authenticated user's ID with caching
   */
  private async getUserId(account: SocialAccount): Promise<string> {
    const cacheKey = account.id;

    // Check cache
    const cached = this.userIdCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.id;
    }

    // Fetch from API
    const response = await this.fetchWithTimeout(`${this.baseUrl}/users/me`, {
      headers: this.getHeaders(account),
    });

    if (!response.ok) {
      throw new Error('Failed to get user ID');
    }

    const data = await response.json();
    const userId = data.data.id;

    // Cache the result
    this.userIdCache.set(cacheKey, {
      id: userId,
      expiresAt: Date.now() + this.cacheExpiryMs,
    });

    return userId;
  }

  /**
   * Clear user ID cache for an account (call when credentials change)
   */
  clearUserIdCache(accountId: string): void {
    this.userIdCache.delete(accountId);
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<Error> {
    let errorData: TwitterError;

    try {
      errorData = await response.json();
    } catch {
      return new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const error = new Error(errorData.detail || errorData.title || 'Twitter API error') as Error & {
      code: string;
      status: number;
      retryable: boolean;
    };

    error.code = errorData.type || 'TWITTER_ERROR';
    error.status = response.status;
    error.retryable = response.status === 429 || response.status >= 500;

    return error;
  }

  /**
   * Validate action is supported
   */
  isActionSupported(action: string): boolean {
    return ['like', 'retweet', 'comment', 'reply'].includes(action);
  }

  /**
   * Get rate limit info from headers
   */
  parseRateLimitHeaders(
    headers: Headers
  ): { remaining: number; reset: number; limit: number } | null {
    const remaining = headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-rate-limit-reset');
    const limit = headers.get('x-rate-limit-limit');

    if (remaining && reset && limit) {
      return {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        limit: parseInt(limit, 10),
      };
    }

    return null;
  }
}

// Singleton instance
let twitterAdapter: TwitterAdapter | null = null;

export function getTwitterAdapter(): TwitterAdapter {
  if (!twitterAdapter) {
    twitterAdapter = new TwitterAdapter();
  }
  return twitterAdapter;
}
