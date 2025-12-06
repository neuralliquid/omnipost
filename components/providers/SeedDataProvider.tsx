/**
 * Seed Data Provider
 * Loads seed data into localStorage on first app load
 */

'use client';

import { useEffect } from 'react';
import { loadAllSeedData, isSeedLoaded, getSeedStats } from '@/lib/seed';

interface SeedDataProviderProps {
  readonly children: React.ReactNode;
}

export function SeedDataProvider({ children }: SeedDataProviderProps) {
  useEffect(() => {
    // Only run in browser
    if (globalThis.window === undefined) {
      return;
    }

    // Load seed data if not already loaded
    if (!isSeedLoaded()) {
      const result = loadAllSeedData();
      const stats = getSeedStats();
      console.log('[SeedDataProvider] Loaded seed data:', {
        series: result.series.length,
        campaigns: result.campaigns.length,
        totalPosts: stats.campaigns.totalPosts,
      });
    }
  }, []);

  // Render children immediately - seed data loading is non-blocking
  return <>{children}</>;
}

export default SeedDataProvider;
