/**
 * Engagement Worker Types
 * Type definitions for multi-account engagement automation with human-like behavior
 */

/**
 * Supported platforms
 */
export type Platform = 'twitter' | 'facebook';

/**
 * Engagement action types
 */
export type EngagementAction = 'like' | 'comment' | 'retweet' | 'share' | 'reply' | 'react';

/**
 * Facebook reaction types
 */
export type FacebookReaction = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

/**
 * Account status
 */
export type AccountStatus = 'active' | 'paused' | 'rate_limited' | 'suspended' | 'error';

/**
 * Worker status
 */
export type WorkerStatus = 'idle' | 'running' | 'paused' | 'stopped';

/**
 * Social media account configuration
 */
export interface SocialAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;

  // Authentication
  credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    apiKey?: string;
    apiSecret?: string;
  };

  // Status
  status: AccountStatus;
  isEnabled: boolean;

  // Rate limiting
  rateLimit: {
    actionsPerHour: number;
    actionsPerDay: number;
    currentHourCount: number;
    currentDayCount: number;
    hourResetAt: string;
    dayResetAt: string;
    cooldownUntil?: string;
  };

  // Behavior profile (personality traits that affect behavior weights)
  behaviorProfile: BehaviorProfile;

  // Statistics
  stats: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    lastActionAt?: string;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Behavior profile - defines account "personality"
 */
export interface BehaviorProfile {
  // Activity patterns
  activityLevel: 'low' | 'medium' | 'high'; // Affects frequency
  peakHours: number[]; // Hours when most active (0-23)
  timezone: string;

  // Engagement style
  engagementStyle: 'lurker' | 'casual' | 'active' | 'enthusiast';
  preferredActions: EngagementAction[]; // Actions this account tends to do more

  // Error tendencies (higher = more likely to make this error)
  typoFrequency: number; // 0-1
  grammarErrorFrequency: number; // 0-1
  autocorrectMistakeFrequency: number; // 0-1
  abandonedActionFrequency: number; // 0-1 - starts but doesn't finish

  // Timing characteristics
  typingSpeedWpm: number; // Words per minute
  readingSpeedWpm: number; // How fast they "read" before engaging
  thinkingDelayMs: { min: number; max: number }; // Pause before action
  scrollBehavior: 'fast' | 'moderate' | 'slow';
}

/**
 * Weighted behavior matrix entry
 */
export interface BehaviorWeight {
  name: string;
  description: string;
  weight: number; // 0-1, probability of this behavior occurring
  category: BehaviorCategory;
  subBehaviors?: BehaviorWeight[];
}

/**
 * Behavior categories
 */
export type BehaviorCategory =
  | 'timing'
  | 'typing_error'
  | 'action_pattern'
  | 'engagement_style'
  | 'abandonment'
  | 'correction';

/**
 * Human error types
 */
export interface HumanError {
  type: HumanErrorType;
  originalText: string;
  errorText: string;
  position: number;
  corrected: boolean;
  correctionDelay?: number;
}

export type HumanErrorType =
  | 'typo_adjacent_key' // Hit adjacent key
  | 'typo_transposition' // Swapped two letters
  | 'typo_double_letter' // Typed letter twice
  | 'typo_missing_letter' // Skipped a letter
  | 'typo_extra_letter' // Added extra letter
  | 'autocorrect_wrong' // Autocorrect "fixed" to wrong word
  | 'grammar_their_there' // Common grammar mistakes
  | 'grammar_your_youre'
  | 'grammar_its_its'
  | 'capitalization_error'
  | 'punctuation_missing'
  | 'space_double' // Double space
  | 'space_missing'; // Missing space

/**
 * Engagement task
 */
export interface EngagementTask {
  id: string;
  accountId: string;
  platform: Platform;
  action: EngagementAction;

  // Target content
  target: {
    postId: string;
    postUrl: string;
    authorHandle?: string;
    content?: string;
  };

  // Comment/reply content (if applicable)
  content?: {
    text: string;
    withErrors?: boolean; // Apply human-like errors
  };

  // Reaction type for Facebook
  reaction?: FacebookReaction;

  // Scheduling
  scheduledAt?: string;
  priority: 'low' | 'normal' | 'high';

  // Execution state
  status: TaskStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  completedAt?: string;
  error?: string;

  // Behavior modifiers for this specific task
  behaviorOverrides?: Partial<BehaviorModifiers>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'scheduled' | 'executing' | 'completed' | 'failed' | 'abandoned';

/**
 * Behavior modifiers that can be applied to tasks
 */
export interface BehaviorModifiers {
  // Skip action entirely (simulate distraction)
  skipProbability: number;

  // Timing modifiers
  delayMultiplier: number;
  rushProbability: number;

  // Error modifiers
  errorMultiplier: number;
  correctionProbability: number;

  // Abandonment
  abandonMidwayProbability: number;
  secondThoughtsProbability: number;
}

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  taskId: string;
  accountId: string;
  success: boolean;

  // What actually happened
  execution: {
    action: EngagementAction;
    startedAt: string;
    completedAt?: string;
    duration: number;

    // The actual content sent (with any errors)
    sentContent?: string;
    errorsIntroduced?: HumanError[];

    // Platform response
    platformResponse?: {
      id: string;
      url?: string;
      [key: string]: unknown;
    };
  };

  // Behavioral events during execution
  behavioralEvents: BehavioralEvent[];

  // If failed
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/**
 * Events that simulate human behavior during task execution
 */
export interface BehavioralEvent {
  timestamp: string;
  type: BehavioralEventType;
  details: Record<string, unknown>;
}

export type BehavioralEventType =
  | 'started_typing'
  | 'paused_typing'
  | 'resumed_typing'
  | 'made_typo'
  | 'corrected_typo'
  | 'deleted_text'
  | 'rewrote_text'
  | 'hesitated'
  | 'scrolled_away'
  | 'scrolled_back'
  | 'abandoned'
  | 'had_second_thoughts'
  | 'changed_reaction'
  | 'submitted';

/**
 * Worker configuration
 */
export interface EngagementWorkerConfig {
  // Processing intervals
  taskCheckIntervalMs: number;
  accountRotationIntervalMs: number;

  // Concurrency
  maxConcurrentTasks: number;
  maxTasksPerAccount: number;

  // Safety limits
  globalActionsPerHour: number;
  globalActionsPerDay: number;
  minDelayBetweenActionsMs: number;
  maxDelayBetweenActionsMs: number;

  // Behavior settings
  enableHumanErrors: boolean;
  errorCorrectionEnabled: boolean;
  naturalTimingEnabled: boolean;

  // Feature flags
  enableTwitter: boolean;
  enableFacebook: boolean;
}

/**
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG: EngagementWorkerConfig = {
  taskCheckIntervalMs: 30000, // 30 seconds
  accountRotationIntervalMs: 300000, // 5 minutes

  maxConcurrentTasks: 3,
  maxTasksPerAccount: 10,

  globalActionsPerHour: 50,
  globalActionsPerDay: 500,
  minDelayBetweenActionsMs: 5000, // 5 seconds minimum
  maxDelayBetweenActionsMs: 120000, // 2 minutes maximum

  enableHumanErrors: true,
  errorCorrectionEnabled: true,
  naturalTimingEnabled: true,

  enableTwitter: true,
  enableFacebook: true,
};

/**
 * Worker statistics
 */
export interface WorkerStats {
  status: WorkerStatus;
  startedAt?: string;
  uptime: number;

  // Action counts
  actionsToday: number;
  actionsThisHour: number;
  totalActions: number;

  // Success rates
  successRate: number;
  failureRate: number;

  // Queue stats
  pendingTasks: number;
  processingTasks: number;
  completedToday: number;
  failedToday: number;

  // Account stats
  activeAccounts: number;
  pausedAccounts: number;
  rateLimitedAccounts: number;

  // Behavioral stats
  errorsIntroduced: number;
  errorsCorrected: number;
  actionsAbandoned: number;
};
