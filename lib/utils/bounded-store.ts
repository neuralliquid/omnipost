/**
 * Bounded Store Utilities
 *
 * Provides shared utilities for managing bounded in-memory stores
 * to prevent memory exhaustion attacks (MEM-01, MEM-02, PERF-03).
 *
 * Used by:
 * - Rate limiting store (app/api/_utils/rateLimit.ts)
 * - Token blacklist (lib/auth/auth-service.ts)
 */

/**
 * Evict oldest entries from a Map using FIFO strategy.
 * Maps in JavaScript preserve insertion order, so iterating keys()
 * gives us entries from oldest to newest.
 *
 * @param map - The Map to evict entries from
 * @param targetSize - The desired size after eviction
 * @returns The number of entries removed
 */
export function evictOldestFromMap<K, V>(map: Map<K, V>, targetSize: number): number {
  const entriesToRemove = map.size - targetSize;
  if (entriesToRemove <= 0) return 0;

  let removed = 0;
  for (const key of map.keys()) {
    if (removed >= entriesToRemove) break;
    map.delete(key);
    removed++;
  }

  return removed;
}

/**
 * Evict a percentage of entries from a Map using FIFO strategy.
 * Useful when you want to make room for new entries without
 * calculating exact target size.
 *
 * @param map - The Map to evict entries from
 * @param percentage - Percentage of entries to remove (0-1)
 * @returns The number of entries removed
 */
export function evictPercentageFromMap<K, V>(map: Map<K, V>, percentage: number): number {
  if (percentage <= 0 || percentage > 1) return 0;

  const entriesToRemove = Math.ceil(map.size * percentage);
  let removed = 0;

  for (const key of map.keys()) {
    if (removed >= entriesToRemove) break;
    map.delete(key);
    removed++;
  }

  return removed;
}

/**
 * Enforce a maximum size on a Map by evicting oldest entries if needed.
 * This is a convenience function that combines size checking and eviction.
 *
 * @param map - The Map to enforce size on
 * @param maxSize - Maximum allowed size
 * @param evictionPercentage - Percentage to evict when at max (default: 0.1 = 10%)
 * @returns The number of entries removed (0 if no eviction needed)
 */
export function enforceMapSize<K, V>(
  map: Map<K, V>,
  maxSize: number,
  evictionPercentage = 0.1
): number {
  if (map.size < maxSize) return 0;

  // Evict percentage of entries to make room
  return evictPercentageFromMap(map, evictionPercentage);
}
