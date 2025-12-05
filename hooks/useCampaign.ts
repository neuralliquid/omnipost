/**
 * Campaign Hook
 * State management for multi-platform content campaigns
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Campaign,
  CampaignContent,
  CampaignPlatform,
  ScheduledPost,
  CreateCampaignInput,
  UpdateCampaignInput,
  PlatformAdaptation,
  createEmptyMetrics,
  createEmptySchedule,
  DEFAULT_PLATFORM_CONFIGS,
  CampaignStatus,
} from '@/types/campaign';
import { platforms as availablePlatforms } from '@/lib/config/platforms';
import { generateCampaignId, generateContentId, generatePostId } from '@/lib/utils/id';

const STORAGE_KEY = 'content-campaigns';

/**
 * Generate unique ID
 * NOTE: Uses Math.random() intentionally - these IDs are for local storage
 * keys only, not security-sensitive operations. The timestamp prefix ensures
 * uniqueness for practical purposes.
 */
function generateId(): string {
  return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate content ID
 * NOTE: Uses Math.random() intentionally - these IDs are for local storage
 * keys only, not security-sensitive operations. The timestamp prefix ensures
 * uniqueness for practical purposes.
 */
function generateContentId(): string {
  return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load campaigns from localStorage
 */
function loadCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
}

/**
 * Save campaigns to localStorage
 */
function saveCampaigns(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Error saving campaigns:', error);
  }
}

/**
 * Campaign hook return type
 */
export interface UseCampaignReturn {
  // State
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // Selection
  selectCampaign: (id: string | null) => void;
  getCampaign: (id: string) => Campaign | undefined;

  // CRUD Operations
  createCampaign: (input: CreateCampaignInput) => Campaign;
  updateCampaign: (id: string, updates: UpdateCampaignInput) => Campaign | null;
  deleteCampaign: (id: string) => boolean;
  duplicateCampaign: (id: string) => Campaign | null;

  // Status Management
  updateStatus: (id: string, status: CampaignStatus) => Campaign | null;
  pauseCampaign: (id: string) => Campaign | null;
  resumeCampaign: (id: string) => Campaign | null;

  // Series Integration
  addSeriesToCampaign: (campaignId: string, seriesId: string) => Campaign | null;
  removeSeriesFromCampaign: (campaignId: string, seriesId: string) => Campaign | null;

  // Content Management
  addContent: (
    campaignId: string,
    content: Omit<CampaignContent, 'id' | 'createdAt' | 'updatedAt'>
  ) => Campaign | null;
  updateContent: (
    campaignId: string,
    contentId: string,
    updates: Partial<CampaignContent>
  ) => Campaign | null;
  removeContent: (campaignId: string, contentId: string) => Campaign | null;

  // Platform Management
  togglePlatform: (campaignId: string, platformId: string) => Campaign | null;
  updatePlatformConfig: (
    campaignId: string,
    platformId: string,
    config: Partial<CampaignPlatform['config']>
  ) => Campaign | null;

  // Content Adaptation
  addAdaptation: (
    campaignId: string,
    contentId: string,
    adaptation: Omit<PlatformAdaptation, 'status'>
  ) => Campaign | null;
  updateAdaptation: (
    campaignId: string,
    contentId: string,
    platformId: string,
    updates: Partial<PlatformAdaptation>
  ) => Campaign | null;

  // Scheduling
  schedulePost: (campaignId: string, post: Omit<ScheduledPost, 'id' | 'status'>) => Campaign | null;
  reschedulePost: (campaignId: string, postId: string, newTime: string) => Campaign | null;
  cancelScheduledPost: (campaignId: string, postId: string) => Campaign | null;

  // Publishing
  markAsPublished: (
    campaignId: string,
    contentId: string,
    platformId: string,
    publishedUrl?: string
  ) => Campaign | null;
  markAsFailed: (
    campaignId: string,
    contentId: string,
    platformId: string,
    error: string
  ) => Campaign | null;

  // Metrics
  updateMetrics: (
    campaignId: string,
    platformId: string,
    metrics: Partial<Campaign['metrics']['platformMetrics'][string]>
  ) => Campaign | null;
  recalculateMetrics: (campaignId: string) => Campaign | null;
}

/**
 * Main campaign hook
 */
export function useCampaign(): UseCampaignReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load campaigns on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const loaded = loadCampaigns();
      setCampaigns(loaded);
      setError(null);
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save campaigns when changed
  useEffect(() => {
    if (!isLoading) {
      saveCampaigns(campaigns);
    }
  }, [campaigns, isLoading]);

  // Get selected campaign
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;

  // Selection
  const selectCampaign = useCallback((id: string | null) => {
    setSelectedCampaignId(id);
  }, []);

  const getCampaign = useCallback(
    (id: string) => {
      return campaigns.find(c => c.id === id);
    },
    [campaigns]
  );

  // Create campaign
  const createCampaign = useCallback((input: CreateCampaignInput): Campaign => {
    const now = new Date().toISOString();

    // Initialize platforms
    const campaignPlatforms: CampaignPlatform[] = availablePlatforms.map(p => ({
      platformId: p.slug,
      platformName: p.name,
      enabled: input.platforms?.includes(p.slug) || false,
      config: DEFAULT_PLATFORM_CONFIGS[p.slug] || {
        postFrequency: 'daily',
        bestTimes: ['09:00', '12:00'],
        threadEnabled: false,
      },
    }));

    const newCampaign: Campaign = {
      id: generateCampaignId(),
      name: input.name,
      description: input.description || '',
      status: 'draft',
      seriesIds: input.seriesIds || [],
      contentItems: [],
      platforms: campaignPlatforms,
      schedule: input.schedule
        ? { ...createEmptySchedule(), ...input.schedule }
        : createEmptySchedule(),
      metrics: createEmptyMetrics(),
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
    };

    setCampaigns(prev => [...prev, newCampaign]);
    return newCampaign;
  }, []);

  // Update campaign
  const updateCampaign = useCallback(
    (id: string, updates: UpdateCampaignInput): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === id) {
            updated = {
              ...c,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  // Delete campaign
  const deleteCampaign = useCallback(
    (id: string): boolean => {
      const exists = campaigns.some(c => c.id === id);
      if (exists) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        if (selectedCampaignId === id) {
          setSelectedCampaignId(null);
        }
      }
      return exists;
    },
    [campaigns, selectedCampaignId]
  );

  // Duplicate campaign
  const duplicateCampaign = useCallback(
    (id: string): Campaign | null => {
      const source = campaigns.find(c => c.id === id);
      if (!source) return null;

      const now = new Date().toISOString();
      const duplicated: Campaign = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateCampaignId(),
        name: `${source.name} (Copy)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        metrics: createEmptyMetrics(),
      };

      // Reset content IDs and statuses
      duplicated.contentItems = duplicated.contentItems.map(item => ({
        ...item,
        id: generateContentId(),
        adaptations: item.adaptations.map(a => ({
          ...a,
          status: 'pending' as const,
          publishedAt: undefined,
          publishedUrl: undefined,
          engagementMetrics: undefined,
        })),
      }));

      duplicated.schedule.posts = [];

      setCampaigns(prev => [...prev, duplicated]);
      return duplicated;
    },
    [campaigns]
  );

  // Status management
  const updateStatus = useCallback(
    (id: string, status: CampaignStatus): Campaign | null => {
      return updateCampaign(id, { status });
    },
    [updateCampaign]
  );

  const pauseCampaign = useCallback(
    (id: string): Campaign | null => {
      return updateStatus(id, 'paused');
    },
    [updateStatus]
  );

  const resumeCampaign = useCallback(
    (id: string): Campaign | null => {
      const campaign = campaigns.find(c => c.id === id);
      if (!campaign) return null;
      const newStatus = campaign.schedule.posts.some(p => p.status === 'scheduled')
        ? 'scheduled'
        : 'active';
      return updateStatus(id, newStatus);
    },
    [campaigns, updateStatus]
  );

  // Series integration
  const addSeriesToCampaign = useCallback(
    (campaignId: string, seriesId: string): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId && !c.seriesIds.includes(seriesId)) {
            updated = {
              ...c,
              seriesIds: [...c.seriesIds, seriesId],
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const removeSeriesFromCampaign = useCallback(
    (campaignId: string, seriesId: string): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              seriesIds: c.seriesIds.filter(id => id !== seriesId),
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  // Content management
  const addContent = useCallback(
    (
      campaignId: string,
      content: Omit<CampaignContent, 'id' | 'createdAt' | 'updatedAt'>
    ): Campaign | null => {
      const now = new Date().toISOString();
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            const newContent: CampaignContent = {
              ...content,
              id: generateContentId(),
              createdAt: now,
              updatedAt: now,
            };
            updated = {
              ...c,
              contentItems: [...c.contentItems, newContent],
              updatedAt: now,
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const updateContent = useCallback(
    (campaignId: string, contentId: string, updates: Partial<CampaignContent>): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              contentItems: c.contentItems.map(item =>
                item.id === contentId
                  ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const removeContent = useCallback((campaignId: string, contentId: string): Campaign | null => {
    let updated: Campaign | null = null;
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id === campaignId) {
          updated = {
            ...c,
            contentItems: c.contentItems.filter(item => item.id !== contentId),
            schedule: {
              ...c.schedule,
              posts: c.schedule.posts.filter(p => p.contentId !== contentId),
            },
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return c;
      })
    );
    return updated;
  }, []);

  // Platform management
  const togglePlatform = useCallback((campaignId: string, platformId: string): Campaign | null => {
    let updated: Campaign | null = null;
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id === campaignId) {
          updated = {
            ...c,
            platforms: c.platforms.map(p =>
              p.platformId === platformId ? { ...p, enabled: !p.enabled } : p
            ),
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return c;
      })
    );
    return updated;
  }, []);

  const updatePlatformConfig = useCallback(
    (
      campaignId: string,
      platformId: string,
      config: Partial<CampaignPlatform['config']>
    ): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              platforms: c.platforms.map(p =>
                p.platformId === platformId ? { ...p, config: { ...p.config, ...config } } : p
              ),
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  // Content adaptation
  const addAdaptation = useCallback(
    (
      campaignId: string,
      contentId: string,
      adaptation: Omit<PlatformAdaptation, 'status'>
    ): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              contentItems: c.contentItems.map(item => {
                if (item.id === contentId) {
                  return {
                    ...item,
                    adaptations: [
                      ...item.adaptations,
                      { ...adaptation, status: 'pending' as const },
                    ],
                    updatedAt: new Date().toISOString(),
                  };
                }
                return item;
              }),
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const updateAdaptation = useCallback(
    (
      campaignId: string,
      contentId: string,
      platformId: string,
      updates: Partial<PlatformAdaptation>
    ): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              contentItems: c.contentItems.map(item => {
                if (item.id === contentId) {
                  return {
                    ...item,
                    adaptations: item.adaptations.map(a =>
                      a.platformId === platformId ? { ...a, ...updates } : a
                    ),
                    updatedAt: new Date().toISOString(),
                  };
                }
                return item;
              }),
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  // Scheduling
  const schedulePost = useCallback(
    (campaignId: string, post: Omit<ScheduledPost, 'id' | 'status'>): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            const newPost: ScheduledPost = {
              ...post,
              id: generatePostId(),
              status: 'scheduled',
            };
            updated = {
              ...c,
              schedule: {
                ...c.schedule,
                posts: [...c.schedule.posts, newPost],
              },
              status: c.status === 'draft' ? 'scheduled' : c.status,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const reschedulePost = useCallback(
    (campaignId: string, postId: string, newTime: string): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            updated = {
              ...c,
              schedule: {
                ...c.schedule,
                posts: c.schedule.posts.map(p =>
                  p.id === postId ? { ...p, scheduledTime: newTime } : p
                ),
              },
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const cancelScheduledPost = useCallback((campaignId: string, postId: string): Campaign | null => {
    let updated: Campaign | null = null;
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id === campaignId) {
          updated = {
            ...c,
            schedule: {
              ...c.schedule,
              posts: c.schedule.posts.filter(p => p.id !== postId),
            },
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return c;
      })
    );
    return updated;
  }, []);

  // Publishing
  const markAsPublished = useCallback(
    (
      campaignId: string,
      contentId: string,
      platformId: string,
      publishedUrl?: string
    ): Campaign | null => {
      const now = new Date().toISOString();
      return updateAdaptation(campaignId, contentId, platformId, {
        status: 'published',
        publishedAt: now,
        publishedUrl,
      });
    },
    [updateAdaptation]
  );

  const markAsFailed = useCallback(
    (campaignId: string, contentId: string, platformId: string, error: string): Campaign | null => {
      return updateAdaptation(campaignId, contentId, platformId, {
        status: 'failed',
        error,
      });
    },
    [updateAdaptation]
  );

  // Metrics
  const updateMetrics = useCallback(
    (
      campaignId: string,
      platformId: string,
      metrics: Partial<Campaign['metrics']['platformMetrics'][string]>
    ): Campaign | null => {
      let updated: Campaign | null = null;
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            const platformMetrics = {
              ...c.metrics.platformMetrics,
              [platformId]: {
                ...(c.metrics.platformMetrics[platformId] || {
                  impressions: 0,
                  engagements: 0,
                  clicks: 0,
                  shares: 0,
                  comments: 0,
                }),
                ...metrics,
              },
            };

            // Calculate totals
            const totalEngagement = Object.values(platformMetrics).reduce(
              (sum, m) => sum + (m.engagements || 0),
              0
            );

            updated = {
              ...c,
              metrics: {
                ...c.metrics,
                platformMetrics,
                totalEngagement,
              },
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return c;
        })
      );
      return updated;
    },
    []
  );

  const recalculateMetrics = useCallback((campaignId: string): Campaign | null => {
    let updated: Campaign | null = null;
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id === campaignId) {
          let totalPosts = 0;
          let publishedPosts = 0;
          let scheduledPosts = 0;
          let failedPosts = 0;

          c.contentItems.forEach(item => {
            item.adaptations.forEach(a => {
              totalPosts++;
              if (a.status === 'published') publishedPosts++;
              if (a.status === 'scheduled') scheduledPosts++;
              if (a.status === 'failed') failedPosts++;
            });
          });

          updated = {
            ...c,
            metrics: {
              ...c.metrics,
              totalPosts,
              publishedPosts,
              scheduledPosts,
              failedPosts,
            },
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return c;
      })
    );
    return updated;
  }, []);

  return {
    campaigns,
    selectedCampaign,
    isLoading,
    error,
    selectCampaign,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    updateStatus,
    pauseCampaign,
    resumeCampaign,
    addSeriesToCampaign,
    removeSeriesFromCampaign,
    addContent,
    updateContent,
    removeContent,
    togglePlatform,
    updatePlatformConfig,
    addAdaptation,
    updateAdaptation,
    schedulePost,
    reschedulePost,
    cancelScheduledPost,
    markAsPublished,
    markAsFailed,
    updateMetrics,
    recalculateMetrics,
  };
}

export default useCampaign;
