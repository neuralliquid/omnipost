/**
 * Platform Adapters
 * Platform-specific implementations for content publishing
 */

import { PlatformAdapter, PlatformPublishResult, ValidationResult, ScheduledJob } from './types';
import { getPlatformConfig } from '@/lib/config/platforms';
import { generatePlatformPostId } from '@/lib/utils/id';

/**
 * Default timeout values for platform API requests (in milliseconds)
 * LinkedIn/Facebook use longer timeouts for text-heavy API calls
 * Instagram uses shorter timeout as media upload endpoints typically respond faster
 */
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const INSTAGRAM_TIMEOUT_MS = 10000; // 10 seconds for media-focused API

/**
 * Error class for partial thread publish failures
 * Thrown when some tweets in a thread are published but later ones fail
 */
export class PartialPublishError extends Error {
  constructor(
    message: string,
    public readonly partialResult: {
      tweetIds: string[];
      error: Error;
    }
  ) {
    super(message);
    this.name = 'PartialPublishError';
  }
}

/**
 * Base adapter with common functionality
 */
abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract platformId: string;
  abstract getMaxLength(): number;

  abstract publish(content: ScheduledJob['content']): Promise<PlatformPublishResult>;

  validateContent(content: ScheduledJob['content']): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const maxLength = this.getMaxLength();

    if (!content.text || content.text.trim().length === 0) {
      errors.push('Content text is required');
    }

    if (content.text && content.text.length > maxLength) {
      errors.push(
        `Content exceeds maximum length of ${maxLength} characters (${content.text.length})`
      );
    }

    if (content.hashtags && content.hashtags.length > 10) {
      warnings.push('Using more than 10 hashtags may reduce engagement');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Simulate API call for development
   * NOTE: Uses Math.random() intentionally - only for development simulation
   * and mock IDs, not security-sensitive operations
   */
  protected async simulatePublish(
    content: ScheduledJob['content'],
    platformName: string
  ): Promise<PlatformPublishResult> {
    // Simulate network delay (random delay is acceptable for simulation purposes)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate mock response using secure ID generation
    const postId = generatePlatformPostId(this.platformId);

    return {
      id: postId,
      url: this.getMockUrl(postId),
      platformData: {
        platform: platformName,
        text: content.text,
        createdAt: new Date().toISOString(),
      },
    };
  }

  protected abstract getMockUrl(postId: string): string;
}

/**
 * Twitter/X Adapter
 */
export class TwitterAdapter extends BasePlatformAdapter {
  platformId = 'twitter';

  getMaxLength(): number {
    return 280;
  }

  async publish(content: ScheduledJob['content']): Promise<PlatformPublishResult> {
    const config = getPlatformConfig('twitter');

    // In production, use actual Twitter API
    if (config?.apiKey && process.env.NODE_ENV === 'production') {
      return this.publishToTwitter(content, config);
    }

    // Development: simulate
    return this.simulatePublish(content, 'Twitter');
  }

  private async publishToTwitter(
    content: ScheduledJob['content'],
    config: { apiUrl: string; apiKey: string }
  ): Promise<PlatformPublishResult> {
    // Handle threads
    if (content.isThread && content.threadParts) {
      return this.publishThread(content, config);
    }

    // Single tweet
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: this.formatContent(content),
      }),
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data?.id || data.id,
      url: `https://twitter.com/i/web/status/${data.data?.id || data.id}`,
      platformData: data,
    };
  }

  private async publishThread(
    content: ScheduledJob['content'],
    config: { apiUrl: string; apiKey: string }
  ): Promise<PlatformPublishResult> {
    const tweetIds: string[] = [];
    let replyToId: string | undefined;

    try {
      for (const part of content.threadParts!) {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: part.text,
            reply: replyToId ? { in_reply_to_tweet_id: replyToId } : undefined,
          }),
        });

        if (!response.ok) {
          const error = new Error(`Twitter API error: ${response.status}`);
          // If we have already posted some tweets, throw a partial publish error
          if (tweetIds.length > 0) {
            throw new PartialPublishError(
              `Thread partially published: ${tweetIds.length} tweets posted before failure`,
              { tweetIds, error }
            );
          }
          throw error;
        }

        const data = await response.json();
        const tweetId = data.data?.id || data.id;
        tweetIds.push(tweetId);
        replyToId = tweetId;
      }

      return {
        id: tweetIds[0],
        url: `https://twitter.com/i/web/status/${tweetIds[0]}`,
        platformData: { tweetIds, isThread: true },
      };
    } catch (error) {
      // Re-throw PartialPublishError as-is
      if (error instanceof PartialPublishError) {
        throw error;
      }

      // If we have posted some tweets but caught a different error, wrap it
      if (tweetIds.length > 0) {
        throw new PartialPublishError(
          `Thread partially published: ${tweetIds.length} tweets posted before failure`,
          { tweetIds, error: error as Error }
        );
      }

      throw error;
    }
  }

  private formatContent(content: ScheduledJob['content']): string {
    let text = content.text;

    // Add hashtags if space allows
    if (content.hashtags && content.hashtags.length > 0) {
      const hashtags = content.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ');
      if (text.length + 1 + hashtags.length <= this.getMaxLength()) {
        text = `${text}\n\n${hashtags}`;
      }
    }

    return text;
  }

  protected getMockUrl(postId: string): string {
    return `https://twitter.com/user/status/${postId}`;
  }

  validateContent(content: ScheduledJob['content']): ValidationResult {
    const result = super.validateContent(content);

    // Thread validation
    if (content.isThread && content.threadParts) {
      for (let i = 0; i < content.threadParts.length; i++) {
        const part = content.threadParts[i];
        if (part.text.length > 280) {
          result.errors.push(`Thread part ${i + 1} exceeds 280 characters`);
          result.valid = false;
        }
      }
    }

    return result;
  }
}

/**
 * LinkedIn Adapter
 */
export class LinkedInAdapter extends BasePlatformAdapter {
  platformId = 'linkedin';

  getMaxLength(): number {
    return 3000;
  }

  async publish(content: ScheduledJob['content']): Promise<PlatformPublishResult> {
    const config = getPlatformConfig('linkedin');

    if (config?.apiKey && process.env.NODE_ENV === 'production') {
      return this.publishToLinkedIn(content, config);
    }

    return this.simulatePublish(content, 'LinkedIn');
  }

  private async publishToLinkedIn(
    content: ScheduledJob['content'],
    config: { apiUrl: string; apiKey: string; timeoutMs?: number }
  ): Promise<PlatformPublishResult> {
    // AbortController is a global in Node.js 16+ and all modern browsers
    const controller = new globalThis.AbortController();
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: this.formatContent(content),
          visibility: 'PUBLIC',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: `https://www.linkedin.com/feed/update/${data.id}`,
        platformData: data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`LinkedIn API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatContent(content: ScheduledJob['content']): string {
    let text = content.text;

    // LinkedIn prefers fewer hashtags
    if (content.hashtags && content.hashtags.length > 0) {
      const hashtags = content.hashtags
        .slice(0, 5)
        .map(h => (h.startsWith('#') ? h : `#${h}`))
        .join(' ');
      text = `${text}\n\n${hashtags}`;
    }

    return text;
  }

  protected getMockUrl(postId: string): string {
    return `https://www.linkedin.com/feed/update/${postId}`;
  }
}

/**
 * Facebook Adapter
 */
export class FacebookAdapter extends BasePlatformAdapter {
  platformId = 'facebook';

  getMaxLength(): number {
    return 63206;
  }

  async publish(content: ScheduledJob['content']): Promise<PlatformPublishResult> {
    const config = getPlatformConfig('facebook');

    if (config?.apiKey && process.env.NODE_ENV === 'production') {
      return this.publishToFacebook(content, config);
    }

    return this.simulatePublish(content, 'Facebook');
  }

  private async publishToFacebook(
    content: ScheduledJob['content'],
    config: { apiUrl: string; apiKey: string; timeoutMs?: number }
  ): Promise<PlatformPublishResult> {
    // AbortController is a global in Node.js 16+ and all modern browsers
    const controller = new globalThis.AbortController();
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: `https://www.facebook.com/${data.id}`,
        platformData: data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Facebook API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected getMockUrl(postId: string): string {
    return `https://www.facebook.com/posts/${postId}`;
  }
}

/**
 * Instagram Adapter
 */
export class InstagramAdapter extends BasePlatformAdapter {
  platformId = 'instagram';

  getMaxLength(): number {
    return 2200;
  }

  async publish(content: ScheduledJob['content']): Promise<PlatformPublishResult> {
    const config = getPlatformConfig('instagram');

    if (config?.apiKey && process.env.NODE_ENV === 'production') {
      return this.publishToInstagram(content, config);
    }

    return this.simulatePublish(content, 'Instagram');
  }

  private async publishToInstagram(
    content: ScheduledJob['content'],
    config: { apiUrl: string; apiKey: string; timeoutMs?: number }
  ): Promise<PlatformPublishResult> {
    // Instagram requires media for posts
    if (!content.mediaUrls || content.mediaUrls.length === 0) {
      throw new Error('Instagram posts require at least one image');
    }

    // AbortController is a global in Node.js 16+ and all modern browsers
    const controller = new globalThis.AbortController();
    const timeoutMs = config.timeoutMs ?? INSTAGRAM_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: this.formatContent(content),
          media_url: content.mediaUrls[0],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        url: `https://www.instagram.com/p/${data.id}`,
        platformData: data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Instagram API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatContent(content: ScheduledJob['content']): string {
    let text = content.text;

    // Instagram uses more hashtags
    if (content.hashtags && content.hashtags.length > 0) {
      const hashtags = content.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ');
      text = `${text}\n\n.\n.\n.\n${hashtags}`;
    }

    return text;
  }

  protected getMockUrl(postId: string): string {
    return `https://www.instagram.com/p/${postId}`;
  }

  validateContent(content: ScheduledJob['content']): ValidationResult {
    const result = super.validateContent(content);

    // Instagram requires media (in production)
    if (process.env.NODE_ENV === 'production') {
      if (!content.mediaUrls || content.mediaUrls.length === 0) {
        result.errors.push('Instagram posts require at least one image');
        result.valid = false;
      }
    }

    return result;
  }
}

/**
 * Adapter registry
 */
const adapters = new Map<string, PlatformAdapter>();
adapters.set('twitter', new TwitterAdapter());
adapters.set('linkedin', new LinkedInAdapter());
adapters.set('facebook', new FacebookAdapter());
adapters.set('instagram', new InstagramAdapter());

/**
 * Get adapter for a platform
 */
export function getAdapter(platformId: string): PlatformAdapter | undefined {
  return adapters.get(platformId);
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values());
}

/**
 * Register a custom adapter
 */
export function registerAdapter(adapter: PlatformAdapter): void {
  adapters.set(adapter.platformId, adapter);
}
