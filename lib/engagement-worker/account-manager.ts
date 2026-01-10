/**
 * Account Manager
 * Manages multiple social media accounts for engagement automation
 */

import {
  SocialAccount,
  AccountStatus,
  Platform,
  BehaviorProfile,
} from './types';
import { createDefaultProfile } from './human-simulator';

/**
 * Account Manager
 * Handles account storage, rotation, and rate limiting
 */
export class AccountManager {
  private accounts: Map<string, SocialAccount> = new Map();
  private accountRotation: Map<Platform, string[]> = new Map();
  private currentAccountIndex: Map<Platform, number> = new Map();

  constructor() {
    // Initialize rotation queues for each platform
    this.accountRotation.set('twitter', []);
    this.accountRotation.set('facebook', []);
    this.currentAccountIndex.set('twitter', 0);
    this.currentAccountIndex.set('facebook', 0);
  }

  /**
   * Add a new account
   */
  addAccount(account: Omit<SocialAccount, 'createdAt' | 'updatedAt'>): SocialAccount {
    const now = new Date().toISOString();
    const fullAccount: SocialAccount = {
      ...account,
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.set(account.id, fullAccount);

    // Add to rotation queue if active
    if (account.isEnabled && account.status === 'active') {
      const rotation = this.accountRotation.get(account.platform) || [];
      rotation.push(account.id);
      this.accountRotation.set(account.platform, rotation);
    }

    return fullAccount;
  }

  /**
   * Remove an account
   */
  removeAccount(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    // Remove from rotation
    const rotation = this.accountRotation.get(account.platform) || [];
    const index = rotation.indexOf(accountId);
    if (index !== -1) {
      rotation.splice(index, 1);
      this.accountRotation.set(account.platform, rotation);
    }

    this.accounts.delete(accountId);
    return true;
  }

  /**
   * Get an account by ID
   */
  getAccount(accountId: string): SocialAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): SocialAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get accounts by platform
   */
  getAccountsByPlatform(platform: Platform): SocialAccount[] {
    return Array.from(this.accounts.values()).filter(
      (account) => account.platform === platform
    );
  }

  /**
   * Get active accounts for a platform
   */
  getActiveAccounts(platform: Platform): SocialAccount[] {
    return this.getAccountsByPlatform(platform).filter(
      (account) => account.isEnabled && account.status === 'active'
    );
  }

  /**
   * Enable an account
   */
  enableAccount(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.isEnabled = true;
    account.updatedAt = new Date().toISOString();

    // Add to rotation if active
    if (account.status === 'active') {
      const rotation = this.accountRotation.get(account.platform) || [];
      if (!rotation.includes(accountId)) {
        rotation.push(accountId);
        this.accountRotation.set(account.platform, rotation);
      }
    }

    return true;
  }

  /**
   * Disable an account
   */
  disableAccount(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.isEnabled = false;
    account.updatedAt = new Date().toISOString();

    // Remove from rotation
    const rotation = this.accountRotation.get(account.platform) || [];
    const index = rotation.indexOf(accountId);
    if (index !== -1) {
      rotation.splice(index, 1);
      this.accountRotation.set(account.platform, rotation);
    }

    return true;
  }

  /**
   * Update account status
   */
  updateStatus(accountId: string, status: AccountStatus): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.status = status;
    account.updatedAt = new Date().toISOString();

    const rotation = this.accountRotation.get(account.platform) || [];
    const isInRotation = rotation.includes(accountId);

    // Update rotation based on status
    if (status === 'active' && account.isEnabled && !isInRotation) {
      rotation.push(accountId);
      this.accountRotation.set(account.platform, rotation);
    } else if (status !== 'active' && isInRotation) {
      const index = rotation.indexOf(accountId);
      rotation.splice(index, 1);
      this.accountRotation.set(account.platform, rotation);
    }

    return true;
  }

  /**
   * Get next account in rotation for a platform
   */
  getNextAccount(platform: Platform): SocialAccount | null {
    const rotation = this.accountRotation.get(platform) || [];
    if (rotation.length === 0) return null;

    let currentIndex = this.currentAccountIndex.get(platform) || 0;
    const startIndex = currentIndex;
    let attempts = 0;

    // Find next available account
    while (attempts < rotation.length) {
      const accountId = rotation[currentIndex];
      const account = this.accounts.get(accountId);

      if (account && this.isAccountAvailable(account)) {
        // Move to next for future rotations
        this.currentAccountIndex.set(platform, (currentIndex + 1) % rotation.length);
        return account;
      }

      currentIndex = (currentIndex + 1) % rotation.length;
      attempts++;
    }

    // Reset index if we've gone full circle
    this.currentAccountIndex.set(platform, startIndex);
    return null;
  }

  /**
   * Check if an account is available for action
   */
  isAccountAvailable(account: SocialAccount): boolean {
    if (!account.isEnabled) return false;
    if (account.status !== 'active') return false;

    // Check cooldown
    if (account.rateLimit.cooldownUntil) {
      const cooldownTime = new Date(account.rateLimit.cooldownUntil).getTime();
      if (Date.now() < cooldownTime) return false;
    }

    // Check hourly rate limit
    this.resetRateLimitIfNeeded(account);
    if (account.rateLimit.currentHourCount >= account.rateLimit.actionsPerHour) {
      return false;
    }

    // Check daily rate limit
    if (account.rateLimit.currentDayCount >= account.rateLimit.actionsPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Record an action for an account (updates rate limits)
   */
  recordAction(accountId: string, success: boolean): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    this.resetRateLimitIfNeeded(account);

    account.rateLimit.currentHourCount++;
    account.rateLimit.currentDayCount++;
    account.stats.totalActions++;

    if (success) {
      account.stats.successfulActions++;
    } else {
      account.stats.failedActions++;
    }

    account.stats.lastActionAt = new Date().toISOString();
    account.updatedAt = new Date().toISOString();
  }

  /**
   * Set a cooldown on an account (e.g., after rate limit error)
   */
  setCooldown(accountId: string, durationMs: number): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    account.rateLimit.cooldownUntil = new Date(Date.now() + durationMs).toISOString();
    account.updatedAt = new Date().toISOString();
  }

  /**
   * Put account in rate limited state
   */
  setRateLimited(accountId: string, resetInMs: number): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    account.status = 'rate_limited';
    account.rateLimit.cooldownUntil = new Date(Date.now() + resetInMs).toISOString();
    account.updatedAt = new Date().toISOString();

    // Remove from rotation temporarily
    const rotation = this.accountRotation.get(account.platform) || [];
    const index = rotation.indexOf(accountId);
    if (index !== -1) {
      rotation.splice(index, 1);
      this.accountRotation.set(account.platform, rotation);
    }

    // Schedule re-activation
    setTimeout(() => {
      this.updateStatus(accountId, 'active');
    }, resetInMs);
  }

  /**
   * Get account statistics summary
   */
  getStats(): AccountStats {
    const accounts = Array.from(this.accounts.values());

    return {
      total: accounts.length,
      active: accounts.filter((a) => a.status === 'active' && a.isEnabled).length,
      paused: accounts.filter((a) => !a.isEnabled).length,
      rateLimited: accounts.filter((a) => a.status === 'rate_limited').length,
      suspended: accounts.filter((a) => a.status === 'suspended').length,
      error: accounts.filter((a) => a.status === 'error').length,
      byPlatform: {
        twitter: accounts.filter((a) => a.platform === 'twitter').length,
        facebook: accounts.filter((a) => a.platform === 'facebook').length,
      },
      totalActions: accounts.reduce((sum, a) => sum + a.stats.totalActions, 0),
      successRate:
        accounts.reduce((sum, a) => sum + a.stats.successfulActions, 0) /
          Math.max(accounts.reduce((sum, a) => sum + a.stats.totalActions, 0), 1) || 0,
    };
  }

  /**
   * Update account credentials
   */
  updateCredentials(
    accountId: string,
    credentials: Partial<SocialAccount['credentials']>
  ): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.credentials = { ...account.credentials, ...credentials };
    account.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Update account behavior profile
   */
  updateBehaviorProfile(
    accountId: string,
    profile: Partial<BehaviorProfile>
  ): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.behaviorProfile = { ...account.behaviorProfile, ...profile };
    account.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Export accounts (without sensitive credentials)
   */
  exportAccounts(): ExportedAccount[] {
    return Array.from(this.accounts.values()).map((account) => ({
      id: account.id,
      platform: account.platform,
      name: account.name,
      handle: account.handle,
      status: account.status,
      isEnabled: account.isEnabled,
      behaviorProfile: account.behaviorProfile,
      stats: account.stats,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  /**
   * Reset rate limit counters if windows have passed
   */
  private resetRateLimitIfNeeded(account: SocialAccount): void {
    const now = new Date();

    // Check hourly reset
    const hourReset = new Date(account.rateLimit.hourResetAt);
    if (now >= hourReset) {
      account.rateLimit.currentHourCount = 0;
      account.rateLimit.hourResetAt = new Date(now.getTime() + 3600000).toISOString();
    }

    // Check daily reset
    const dayReset = new Date(account.rateLimit.dayResetAt);
    if (now >= dayReset) {
      account.rateLimit.currentDayCount = 0;
      // Reset at midnight local time
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      account.rateLimit.dayResetAt = tomorrow.toISOString();
    }

    // Clear cooldown if expired
    if (account.rateLimit.cooldownUntil) {
      const cooldownTime = new Date(account.rateLimit.cooldownUntil);
      if (now >= cooldownTime) {
        account.rateLimit.cooldownUntil = undefined;
      }
    }
  }
}

/**
 * Account statistics
 */
export interface AccountStats {
  total: number;
  active: number;
  paused: number;
  rateLimited: number;
  suspended: number;
  error: number;
  byPlatform: Record<Platform, number>;
  totalActions: number;
  successRate: number;
}

/**
 * Exported account (without credentials)
 */
export interface ExportedAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;
  status: AccountStatus;
  isEnabled: boolean;
  behaviorProfile: BehaviorProfile;
  stats: SocialAccount['stats'];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new account with default values
 */
export function createAccount(
  params: {
    id: string;
    platform: Platform;
    name: string;
    handle: string;
    accessToken: string;
    refreshToken?: string;
    apiKey?: string;
    apiSecret?: string;
  },
  profileOverrides?: Partial<BehaviorProfile>
): Omit<SocialAccount, 'createdAt' | 'updatedAt'> {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 3600000);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Default rate limits by platform
  const rateLimits: Record<Platform, { perHour: number; perDay: number }> = {
    twitter: { perHour: 50, perDay: 300 },
    facebook: { perHour: 30, perDay: 200 },
  };

  const limits = rateLimits[params.platform];

  return {
    id: params.id,
    platform: params.platform,
    name: params.name,
    handle: params.handle,
    credentials: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
    },
    status: 'active',
    isEnabled: true,
    rateLimit: {
      actionsPerHour: limits.perHour,
      actionsPerDay: limits.perDay,
      currentHourCount: 0,
      currentDayCount: 0,
      hourResetAt: nextHour.toISOString(),
      dayResetAt: tomorrow.toISOString(),
    },
    behaviorProfile: createDefaultProfile(profileOverrides),
    stats: {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
    },
  };
}

// Singleton instance
let accountManager: AccountManager | null = null;

export function getAccountManager(): AccountManager {
  if (!accountManager) {
    accountManager = new AccountManager();
  }
  return accountManager;
}
