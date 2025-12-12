/**
 * Site Configuration Types and Validation
 *
 * This module provides type-safe access to site configuration,
 * with runtime validation to prevent crashes from malformed data.
 */

import rawConfig from './siteConfig.json';

/**
 * Navigation item interface
 */
export interface NavigationItem {
  name: string;
  path: string;
}

/**
 * Analytics configuration interface
 */
export interface AnalyticsConfig {
  enabledInDevelopment: boolean;
  googleAnalyticsId: string;
}

/**
 * Social media links interface
 */
export interface SocialConfig {
  twitter?: string;
  linkedin?: string;
  github?: string;
}

/**
 * Complete site configuration interface
 */
export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  analytics: AnalyticsConfig;
  navigation: NavigationItem[];
  social: SocialConfig;
}

/**
 * Default configuration values for fallback
 */
const defaultConfig: SiteConfig = {
  siteName: 'OmniPost',
  siteDescription: 'AI-powered multi-platform content publishing',
  siteUrl: 'https://yoursite.com',
  analytics: {
    enabledInDevelopment: false,
    googleAnalyticsId: '',
  },
  navigation: [],
  social: {},
};

/**
 * Validates a navigation item
 */
function isValidNavigationItem(item: unknown): item is NavigationItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as NavigationItem).name === 'string' &&
    typeof (item as NavigationItem).path === 'string' &&
    (item as NavigationItem).name.length > 0 &&
    (item as NavigationItem).path.length > 0
  );
}

/**
 * Validates and sanitizes the navigation array
 */
function validateNavigation(navigation: unknown): NavigationItem[] {
  if (!Array.isArray(navigation)) {
    console.warn('[SiteConfig] navigation is not an array, using empty array');
    return [];
  }

  const validItems: NavigationItem[] = [];

  for (let index = 0; index < navigation.length; index++) {
    const item = navigation[index];
    if (isValidNavigationItem(item)) {
      validItems.push(item);
    } else {
      // Use format specifier to avoid format string injection (Codacy security rule)
      console.warn('[SiteConfig] Invalid navigation item at index %d:', index, item);
    }
  }

  return validItems;
}

/**
 * Validates and sanitizes the analytics config
 */
function validateAnalytics(analytics: unknown): AnalyticsConfig {
  if (typeof analytics !== 'object' || analytics === null) {
    return defaultConfig.analytics;
  }

  const config = analytics as Record<string, unknown>;
  return {
    enabledInDevelopment:
      typeof config.enabledInDevelopment === 'boolean' ? config.enabledInDevelopment : false,
    googleAnalyticsId: typeof config.googleAnalyticsId === 'string' ? config.googleAnalyticsId : '',
  };
}

/**
 * Validates and sanitizes the social config
 */
function validateSocial(social: unknown): SocialConfig {
  if (typeof social !== 'object' || social === null) {
    return {};
  }

  const config = social as Record<string, unknown>;
  const result: SocialConfig = {};

  if (typeof config.twitter === 'string' && config.twitter.length > 0) {
    result.twitter = config.twitter;
  }
  if (typeof config.linkedin === 'string' && config.linkedin.length > 0) {
    result.linkedin = config.linkedin;
  }
  if (typeof config.github === 'string' && config.github.length > 0) {
    result.github = config.github;
  }

  return result;
}

/**
 * Validates the complete site configuration
 */
function validateSiteConfig(config: unknown): SiteConfig {
  if (typeof config !== 'object' || config === null) {
    console.error('[SiteConfig] Configuration is not an object, using defaults');
    return defaultConfig;
  }

  const rawConf = config as Record<string, unknown>;

  return {
    siteName:
      typeof rawConf.siteName === 'string' && rawConf.siteName.length > 0
        ? rawConf.siteName
        : defaultConfig.siteName,
    siteDescription:
      typeof rawConf.siteDescription === 'string'
        ? rawConf.siteDescription
        : defaultConfig.siteDescription,
    siteUrl: typeof rawConf.siteUrl === 'string' ? rawConf.siteUrl : defaultConfig.siteUrl,
    analytics: validateAnalytics(rawConf.analytics),
    navigation: validateNavigation(rawConf.navigation),
    social: validateSocial(rawConf.social),
  };
}

/**
 * Validated site configuration
 * This is the main export - always use this instead of importing JSON directly
 */
export const siteConfig: SiteConfig = validateSiteConfig(rawConfig);

/**
 * Type-safe getter for site name
 */
export function getSiteName(): string {
  return siteConfig.siteName;
}

/**
 * Type-safe getter for navigation items
 */
export function getNavigation(): NavigationItem[] {
  return siteConfig.navigation;
}

/**
 * Check if a path is in the navigation
 */
export function isNavigationPath(path: string): boolean {
  return siteConfig.navigation.some(item => item.path === path);
}

export default siteConfig;
