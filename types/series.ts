/**
 * Platform-specific content adaptation settings
 */
export interface PlatformAdaptation {
  /** Platform slug (e.g., 'facebook', 'linkedin') */
  platformId: string;
  /** Whether this platform is enabled for the series */
  enabled: boolean;
  /** Custom tone/voice for this platform */
  tone?: 'professional' | 'casual' | 'technical' | 'conversational';
  /** Content format preference */
  format?: 'short' | 'medium' | 'long' | 'thread';
  /** Include hashtags */
  includeHashtags?: boolean;
  /** Custom hashtags for this platform */
  customHashtags?: string[];
  /** Include call-to-action */
  includeCTA?: boolean;
  /** Custom CTA text */
  ctaText?: string;
  /** Media preference */
  mediaPreference?: 'text-only' | 'with-image' | 'with-video' | 'carousel';
  /** Additional platform-specific notes */
  notes?: string;
}

/**
 * Series interface representing a content series
 */
export interface Series {
  id: string;
  title: string;
  description: string;
  topics?: string[];
  targetAudience?: string;
  estimatedArticles?: number;
  publishFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  status?: 'planning' | 'in-progress' | 'completed' | 'paused';
  /** Platform-specific adaptations */
  platformAdaptations?: PlatformAdaptation[];
  campaignIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Default platform adaptation settings
 */
export const defaultPlatformAdaptation: Omit<PlatformAdaptation, 'platformId'> = {
  enabled: false,
  tone: 'professional',
  format: 'medium',
  includeHashtags: true,
  includeCTA: true,
  mediaPreference: 'with-image',
};
