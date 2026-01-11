/**
 * Engagement Worker Module
 * Multi-account engagement automation with human-like behavior
 *
 * Features:
 * - Weighted behavior matrix for realistic human simulation
 * - Multi-account management with rotation
 * - Twitter and Facebook support
 * - Natural typing errors, timing, and corrections
 * - Rate limiting and cooldown management
 *
 * Usage:
 * ```typescript
 * import {
 *   getEngagementWorker,
 *   getAccountManager,
 *   createAccount,
 *   createSloppyProfile,
 * } from '@/lib/engagement-worker';
 *
 * // Create account with custom behavior profile
 * const accountManager = getAccountManager();
 * const account = createAccount({
 *   id: 'acc_1',
 *   platform: 'twitter',
 *   name: 'Marketing Account',
 *   handle: '@marketing',
 *   accessToken: 'your_token',
 * }, createSloppyProfile()); // More typos!
 *
 * accountManager.addAccount(account);
 *
 * // Start the worker
 * const worker = getEngagementWorker({
 *   enableHumanErrors: true,
 *   naturalTimingEnabled: true,
 * });
 *
 * worker.start();
 *
 * // Add engagement task
 * const taskId = worker.addTask({
 *   accountId: 'acc_1',
 *   platform: 'twitter',
 *   action: 'comment',
 *   target: {
 *     postId: '123456789',
 *     postUrl: 'https://twitter.com/user/status/123456789',
 *   },
 *   content: {
 *     text: 'Great post! Love this content.',
 *     withErrors: true, // Enable human-like errors
 *   },
 *   priority: 'normal',
 *   maxAttempts: 3,
 * });
 *
 * // Check stats
 * console.log(worker.getStats());
 *
 * // Stop when done
 * worker.stop();
 * ```
 */

// Main worker
export {
  EngagementWorker,
  getEngagementWorker,
  createEngagementWorker,
} from './engagement-worker';

// Account management
export {
  AccountManager,
  getAccountManager,
  createAccount,
  type AccountStats,
  type ExportedAccount,
} from './account-manager';

// Behavior simulation
export {
  HumanSimulator,
  createDefaultProfile,
  createSloppyProfile,
  createCarefulProfile,
  createLurkerProfile,
  type TypedKeystroke,
} from './human-simulator';

// Behavior matrix
export {
  BEHAVIOR_MATRIX,
  ERROR_TYPE_WEIGHTS,
  ADJACENT_KEYS,
  AUTOCORRECT_MISTAKES,
  CONTRACTION_ERRORS,
  TIME_OF_DAY_WEIGHTS,
  DAY_OF_WEEK_WEIGHTS,
  PLATFORM_ACTION_WEIGHTS,
  getAdjustedWeight,
  applyModifiers,
  selectWeightedBehavior,
  shouldBehaviorOccur,
  getBehaviorsByCategory,
  getBehaviorByName,
} from './behavior-matrix';

// Platform adapters
export { TwitterAdapter, getTwitterAdapter } from './platforms/twitter';
export { FacebookAdapter, getFacebookAdapter } from './platforms/facebook';

// Random utilities (documented non-cryptographic PRNG for behavior simulation)
export {
  random,
  randomInRange,
  randomFloat,
  shouldOccur,
  randomChoice,
  weightedChoice,
  shuffle,
  addJitter,
  randomLetter,
} from './random-utils';

// Types
export type {
  // Core types
  Platform,
  EngagementAction,
  FacebookReaction,
  AccountStatus,
  WorkerStatus,
  TaskStatus,

  // Account types
  SocialAccount,
  BehaviorProfile,

  // Behavior types
  BehaviorWeight,
  BehaviorCategory,
  BehaviorModifiers,

  // Error types
  HumanError,
  HumanErrorType,

  // Task types
  EngagementTask,
  TaskExecutionResult,

  // Event types
  BehavioralEvent,
  BehavioralEventType,

  // Config types
  EngagementWorkerConfig,
  WorkerStats,
} from './types';

// Default config
export { DEFAULT_WORKER_CONFIG } from './types';
