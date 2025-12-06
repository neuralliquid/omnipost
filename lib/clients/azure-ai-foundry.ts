/**
 * Azure AI Foundry Client
 *
 * Provides integration with Azure AI Foundry for:
 * - Text generation and processing
 * - Image generation (DALL-E)
 * - Embeddings
 * - Chat completions
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-studio/
 */

import { createHash } from 'node:crypto';
import { logToAuditTrail } from '@/app/api/_utils/audit';

/**
 * Hash user ID for privacy in logs
 */
function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').substring(0, 16);
}

/**
 * Secure audit logging helper - logs operations without exposing sensitive data
 */
function logOperation(
  operation: string,
  userId?: string,
  metadata?: { category?: string; [key: string]: unknown }
): void {
  // Only log in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AI_AUDIT_LOGS !== 'true') {
    return;
  }

  const sanitizedMetadata: Record<string, unknown> = {
    operation,
    category: metadata?.category || 'ai_operation',
    timestamp: new Date().toISOString(),
  };

  // Hash user ID for privacy
  if (userId) {
    sanitizedMetadata.userIdHash = hashUserId(userId);
  }

  // Include safe metadata (no prompts/text content)
  if (metadata) {
    const { category, ...rest } = metadata;
    // Only include numeric/safe fields, exclude any text content
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === 'number' || typeof value === 'boolean') {
        sanitizedMetadata[key] = value;
      }
    }
  }

  // Use centralized audit logging
  void logToAuditTrail({
    action: operation,
    user: userId ? hashUserId(userId) : 'system',
    timestamp: new Date().toISOString(),
    path: '/ai-foundry',
    method: 'API',
    body: sanitizedMetadata,
  });
}

// Configuration interface
export interface AzureAIFoundryConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

// Response interfaces
export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageGenerationResponse {
  id: string;
  created: number;
  data: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

// Cost tracking interface
export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: string;
  operation: string;
}

/**
 * Azure AI Foundry Client
 *
 * Implements retry logic, cost monitoring, and comprehensive error handling
 */
export class AzureAIFoundryClient {
  private readonly config: AzureAIFoundryConfig;
  private usageMetrics: UsageMetrics[] = [];

  // Pricing per 1K tokens (approximate, varies by model)
  private static readonly PRICING = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-35-turbo': { input: 0.0015, output: 0.002 },
    'dall-e-3': { perImage: 0.04 },
    'text-embedding-ada-002': { input: 0.0001 },
  };

  constructor(config?: Partial<AzureAIFoundryConfig>) {
    this.config = {
      endpoint: config?.endpoint || process.env.AZURE_AI_ENDPOINT || '',
      apiKey: config?.apiKey || process.env.AZURE_AI_API_KEY || '',
      apiVersion: config?.apiVersion || process.env.AZURE_AI_API_VERSION || '2024-02-01',
      deploymentName: config?.deploymentName || process.env.AZURE_AI_DEPLOYMENT || 'gpt-4',
    };

    this.validateConfig();
  }

  /**
   * Validate configuration at initialization
   */
  private validateConfig(): void {
    if (!this.config.endpoint) {
      console.warn('Azure AI Foundry: AZURE_AI_ENDPOINT not configured');
    }
    if (!this.config.apiKey) {
      console.warn('Azure AI Foundry: AZURE_AI_API_KEY not configured');
    }
  }

  /**
   * Check if the client is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.config.endpoint && this.config.apiKey);
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; baseDelay?: number; operationName?: string } = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, operationName = 'operation' } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof AzureAIError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Azure AI Foundry: ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
            error
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request to Azure AI Foundry with timeout handling
   * @param path - API path
   * @param body - Request body
   * @param operationName - Name of the operation for logging
   * @param timeoutMs - Timeout in milliseconds (default: 30000)
   */
  private async makeRequest<T>(
    path: string,
    body: object,
    operationName: string,
    timeoutMs: number = 30000
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new AzureAIError('Azure AI Foundry is not configured', 500, 'NOT_CONFIGURED');
    }

    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}${path}?api-version=${this.config.apiVersion}`;

    // Create AbortController for timeout handling
    // AbortController is a global in Node.js 16+ and all modern browsers
    const controller = new globalThis.AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AzureAIError(
          `Azure AI request failed: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const result = await response.json();

      // Track usage for cost monitoring
      if (result.usage) {
        this.trackUsage(result.usage, operationName);
      }

      return result as T;
    } catch (error) {
      // Convert AbortError to a timeout-specific error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AzureAIError(
          `Azure AI request timed out after ${timeoutMs}ms`,
          408,
          `Operation '${operationName}' exceeded timeout of ${timeoutMs}ms`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Track usage metrics for cost monitoring
   */
  private trackUsage(
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
    operation: string
  ): void {
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    // Calculate estimated cost based on model
    const pricing =
      AzureAIFoundryClient.PRICING[
        this.config.deploymentName as keyof typeof AzureAIFoundryClient.PRICING
      ] || AzureAIFoundryClient.PRICING['gpt-35-turbo'];

    let estimatedCost = 0;
    if ('input' in pricing && 'output' in pricing) {
      estimatedCost =
        (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
    }

    const metrics: UsageMetrics = {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      timestamp: new Date().toISOString(),
      operation,
    };

    this.usageMetrics.push(metrics);

    // Log for monitoring
    console.log('[AZURE_AI_USAGE]', JSON.stringify(metrics));
  }

  /**
   * Get accumulated usage metrics
   */
  public getUsageMetrics(): UsageMetrics[] {
    return [...this.usageMetrics];
  }

  /**
   * Get total estimated cost
   */
  public getTotalEstimatedCost(): number {
    return this.usageMetrics.reduce((total, m) => total + m.estimatedCost, 0);
  }

  /**
   * Clear usage metrics
   */
  public clearUsageMetrics(): void {
    this.usageMetrics = [];
  }

  /**
   * Chat completion - for text generation and processing
   */
  public async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      userId?: string;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const { temperature = 0.7, maxTokens = 1000, userId } = options;

    return this.withRetry(
      async () => {
        const result = await this.makeRequest<ChatCompletionResponse>(
          '/chat/completions',
          {
            messages,
            temperature,
            max_tokens: maxTokens,
          },
          'chat_completion'
        );

        // Audit log
        if (userId) {
          logOperation('AZURE_AI_CHAT_COMPLETION', userId, {
            category: 'chat_completion',
            tokensUsed: result.usage?.totalTokens,
          });
        }

        return result;
      },
      { operationName: 'chatCompletion' }
    );
  }

  /**
   * Text summarization using chat completion
   */
  public async summarizeText(
    text: string,
    options: { maxLength?: number; userId?: string } = {}
  ): Promise<string> {
    const { maxLength = 500, userId } = options;

    const response = await this.chatCompletion(
      [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes text concisely. Keep summaries under ${maxLength} characters.`,
        },
        {
          role: 'user',
          content: `Please summarize the following text:\n\n${text}`,
        },
      ],
      { userId }
    );

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Text parsing and extraction
   */
  public async parseText(
    text: string,
    extractionPrompt: string,
    options: { userId?: string } = {}
  ): Promise<string> {
    const { userId } = options;

    const response = await this.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a helpful assistant that extracts and structures information from text.',
        },
        {
          role: 'user',
          content: `${extractionPrompt}\n\nText to process:\n${text}`,
        },
      ],
      { userId }
    );

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Image generation using DALL-E (if available in deployment)
   */
  public async generateImage(
    prompt: string,
    options: {
      size?: '1024x1024' | '1024x1792' | '1792x1024';
      quality?: 'standard' | 'hd';
      style?: 'vivid' | 'natural';
      userId?: string;
    } = {}
  ): Promise<ImageGenerationResponse> {
    const { size = '1024x1024', quality = 'standard', style = 'vivid', userId } = options;

    // Store original deployment and switch to DALL-E
    const originalDeployment = this.config.deploymentName;
    this.config.deploymentName = process.env.AZURE_AI_DALLE_DEPLOYMENT || 'dall-e-3';

    try {
      const result = await this.withRetry(
        async () => {
          const response = await this.makeRequest<ImageGenerationResponse>(
            '/images/generations',
            {
              prompt,
              size,
              quality,
              style,
              n: 1,
            },
            'image_generation'
          );

          // Track image generation cost
          this.usageMetrics.push({
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            estimatedCost: AzureAIFoundryClient.PRICING['dall-e-3'].perImage,
            timestamp: new Date().toISOString(),
            operation: 'image_generation',
          });

          if (userId) {
            logOperation('AZURE_AI_IMAGE_GENERATION', userId, {
              category: 'image_generation',
              promptLength: prompt.length,
            });
          }

          return response;
        },
        { operationName: 'generateImage' }
      );

      return result;
    } finally {
      this.config.deploymentName = originalDeployment;
    }
  }

  /**
   * Generate embeddings for text
   */
  public async generateEmbedding(
    text: string,
    options: { userId?: string } = {}
  ): Promise<number[]> {
    const { userId } = options;

    // Store original deployment and switch to embedding model
    const originalDeployment = this.config.deploymentName;
    this.config.deploymentName =
      process.env.AZURE_AI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';

    try {
      const result = await this.withRetry(
        async () => {
          const response = await this.makeRequest<EmbeddingResponse>(
            '/embeddings',
            { input: text },
            'embedding'
          );

          if (userId) {
            logOperation('AZURE_AI_EMBEDDING', userId, {
              category: 'embedding_generation',
              textLength: text.length,
            });
          }

          return response;
        },
        { operationName: 'generateEmbedding' }
      );

      return result.data[0]?.embedding || [];
    } finally {
      this.config.deploymentName = originalDeployment;
    }
  }

  /**
   * Health check for Azure AI Foundry
   */
  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, error: 'Not configured' };
    }

    const startTime = Date.now();

    try {
      await this.chatCompletion([{ role: 'user', content: 'Hello' }], { maxTokens: 5 });

      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Custom error class for Azure AI Foundry errors
 */
export class AzureAIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'AzureAIError';
  }
}

// Export singleton instance
export const azureAIClient = new AzureAIFoundryClient();
