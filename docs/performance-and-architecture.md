# Performance & Architecture Review — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Executive Summary

This document captures performance and architectural improvements identified during the Phase 4 audit, focusing on runtime efficiency, memory usage, bundle size, database queries, caching, and scalability concerns.

**Runtime Issues:** 4 | **Memory Issues:** 2 | **Bundle/Loading Issues:** 2 | **API Efficiency Issues:** 2 | **Total:** 10

---

## Runtime Efficiency Issues

### PERF-01: Inefficient useCallback Dependencies

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| **ID**       | PERF-01                                 |
| **Severity** | High                                    |
| **Impact**   | Double-fetches, unnecessary re-renders  |
| **Effort**   | M (Medium)                              |
| **File**     | `components/content/ContentManager.tsx` |
| **Lines**    | 26-47, 50-52                            |

**Description:**
The `fetchContent` callback is recreated on every dependency change, which triggers the useEffect, causing potential double-fetches.

**Evidence:**

```typescript
const fetchContent = useCallback(async () => {
  // fetch logic
}, [page, pageSize, filter]); // Recreates on any change

useEffect(() => {
  fetchContent(); // Triggered when fetchContent changes
}, [fetchContent]); // Creates refetch loop
```

**Recommended Fix:**

```typescript
// Separate fetch trigger from callback
const fetchContent = useCallback(async (p: number, ps: number, f: string) => {
  // fetch logic using parameters
}, []); // Stable callback

useEffect(() => {
  fetchContent(page, pageSize, filter);
}, [page, pageSize, filter, fetchContent]);
```

**Test Coverage Required:**

- Performance test measuring render count
- Integration test verifying single fetch per state change

---

### PERF-02: Multiple Re-renders in SeedDataProvider

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| **ID**       | PERF-02                                     |
| **Severity** | Medium                                      |
| **Impact**   | Unnecessary child re-renders                |
| **Effort**   | S (Small)                                   |
| **File**     | `components/providers/SeedDataProvider.tsx` |
| **Lines**    | 15-32                                       |

**Description:**
Provider value is not memoized, causing all consumers to re-render on any state change.

**Recommended Fix:**

```typescript
const contextValue = useMemo(() => ({ seedData, isLoading, error }), [seedData, isLoading, error]);
```

---

### PERF-03: Unbounded Rate Limit Store Growth

| Field        | Value                               |
| ------------ | ----------------------------------- |
| **ID**       | PERF-03                             |
| **Severity** | High                                |
| **Impact**   | Memory leak under sustained traffic |
| **Effort**   | M (Medium)                          |
| **File**     | `app/api/_utils/rateLimit.ts`       |
| **Lines**    | 161-246                             |

**Description:**
In-memory rate limit store has no maximum size enforcement. Opportunistic cleanup every 60s may not keep up with high traffic.

**Evidence:**

```typescript
const rateLimitStore = new Map<string, RateLimitEntry>();
// No maximum size
// Cleanup only every 60 seconds
```

**Recommended Fix:**

1. Implement LRU cache with maximum size
2. Use Redis/Upstash for production
3. Add size monitoring and alerts

---

### PERF-04: Eager Feature Flag Evaluation Race Condition

| Field        | Value                               |
| ------------ | ----------------------------------- |
| **ID**       | PERF-04                             |
| **Severity** | Medium                              |
| **Impact**   | Inconsistent behavior on cold start |
| **Effort**   | S (Small)                           |
| **File**     | `app/api/_utils/rateLimit.ts`       |
| **Lines**    | 56-159                              |

**Description:**
Upstash client initialization happens lazily on first request. Concurrent requests during initialization may cause race conditions.

---

## Memory Issues

### MEM-01: Token Blacklist Memory Leak

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **ID**       | MEM-01                                |
| **Severity** | High                                  |
| **Impact**   | Unbounded memory growth in serverless |
| **Effort**   | M (Medium)                            |
| **File**     | `lib/auth/auth-service.ts`            |
| **Lines**    | 18-160                                |

**Description:**
In-memory token blacklist grows without bounds. In serverless environments, this can persist across warm invocations.

**Evidence:**

```typescript
const tokenBlacklist = new Map<string, number>();

public addToTokenBlacklist(token: string, expiryTime: number): void {
  tokenBlacklist.set(token, Date.now() + expiryTime * 1000);
  this.cleanupBlacklist(); // Only cleans on logout events
}
```

**Recommended Fix:**

1. Move blacklist to Redis/external store
2. Implement maximum size with LRU eviction
3. Add periodic cleanup timer

---

### MEM-02: No Maximum Cache Size for Rate Limiting

| Field        | Value                          |
| ------------ | ------------------------------ |
| **ID**       | MEM-02                         |
| **Severity** | Medium                         |
| **Impact**   | Memory exhaustion under attack |
| **Effort**   | S (Small)                      |
| **File**     | `app/api/_utils/rateLimit.ts`  |

**Description:**
Related to PERF-03. An attacker could exhaust memory by generating unique IPs/keys.

**Recommended Fix:**
Implement maximum entry count with oldest-first eviction.

---

## Bundle Size & Loading Issues

### BUNDLE-01: No Code Splitting for Heavy Components

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **ID**       | BUNDLE-01                             |
| **Severity** | Medium                                |
| **Impact**   | Slower initial page load              |
| **Effort**   | S (Small)                             |
| **File**     | `components/image/ImageGenerator.tsx` |

**Description:**
ImageGenerator component and HuggingFace client are loaded eagerly, regardless of whether the feature is used.

**Recommended Fix:**

```typescript
const ImageGenerator = dynamic(() => import('./ImageGenerator'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

### BUNDLE-02: Missing Bundle Analysis

| Field        | Value                      |
| ------------ | -------------------------- |
| **ID**       | BUNDLE-02                  |
| **Severity** | Low                        |
| **Impact**   | Unknown bundle composition |
| **Effort**   | S (Small)                  |

**Description:**
No bundle analyzer configured. Unknown which dependencies contribute most to bundle size.

**Recommended Fix:**
Add `@next/bundle-analyzer` to identify optimization opportunities.

---

## Database & API Efficiency Issues

### API-01: Unoptimized Lead Queries

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **ID**       | API-01                                |
| **Severity** | Medium                                |
| **Impact**   | Slow queries, excessive data transfer |
| **Effort**   | M (Medium)                            |
| **File**     | `app/api/leads/route.ts`              |
| **Lines**    | 36-73                                 |

**Description:**

- No field selection (retrieves all columns)
- Potential N+1 query issues
- No query result caching
- Score filtering could be O(n) without indexes

**Recommended Fix:**

```typescript
// Select only needed fields
const leads = await db.lead.findMany({
  select: { id: true, name: true, email: true, score: true },
  where: { score: { gte: minScore } },
  take: pageSize,
  skip: (page - 1) * pageSize,
});
```

---

### API-02: Missing Request Caching

| Field        | Value               |
| ------------ | ------------------- |
| **ID**       | API-02              |
| **Severity** | Medium              |
| **Impact**   | Redundant API calls |
| **Effort**   | M (Medium)          |

**Description:**
No caching layer for frequently accessed data (campaigns, series, platforms).

**Recommended Fix:**

1. Implement stale-while-revalidate pattern
2. Use React Query or SWR for client-side caching
3. Add Redis cache for API responses

---

## Architectural Concerns

### ARCH-01: Single-Instance Limitations

| Field        | Value                     |
| ------------ | ------------------------- |
| **ID**       | ARCH-01                   |
| **Severity** | High                      |
| **Impact**   | Cannot scale horizontally |
| **Effort**   | L (Large)                 |

**Description:**
Current architecture assumes single instance:

- In-memory rate limiting
- In-memory token blacklist
- No session affinity consideration

**Scaling Requirements:**

1. Move rate limiting to Redis
2. Move token blacklist to Redis
3. Ensure stateless request handling

---

### ARCH-02: Airtable as Primary Database

| Field        | Value                          |
| ------------ | ------------------------------ |
| **ID**       | ARCH-02                        |
| **Severity** | Medium                         |
| **Impact**   | Rate limits, query limitations |
| **Effort**   | L (Large)                      |

**Description:**
Airtable has API rate limits (5 requests/second) and limited query capabilities.

**Considerations:**

- Cannot handle high-traffic scenarios
- No complex joins or aggregations
- Limited to 50,000 records per table

---

## Priority Summary

| Priority | Count | Category                 |
| -------- | ----- | ------------------------ |
| High     | 4     | Memory, runtime, scaling |
| Medium   | 5     | API efficiency, caching  |
| Low      | 1     | Bundle analysis          |

---

## Recommended Implementation Order

### Phase 1: Critical Memory Issues

1. Fix rate limit store growth (PERF-03, MEM-02)
2. Move token blacklist to external store (MEM-01)

### Phase 2: Runtime Optimization

3. Fix useCallback patterns (PERF-01)
4. Memoize provider values (PERF-02)

### Phase 3: API Efficiency

5. Optimize database queries (API-01)
6. Implement caching layer (API-02)

### Phase 4: Bundle Optimization

7. Add code splitting (BUNDLE-01)
8. Set up bundle analyzer (BUNDLE-02)

---

## Performance Metrics to Track

| Metric                      | Target  | Current |
| --------------------------- | ------- | ------- |
| API Response Time (p95)     | < 500ms | Unknown |
| Time to First Byte          | < 200ms | Unknown |
| Largest Contentful Paint    | < 2.5s  | Unknown |
| First Input Delay           | < 100ms | Unknown |
| Cumulative Layout Shift     | < 0.1   | Unknown |
| Bundle Size (main)          | < 200KB | Unknown |
| Memory Usage (steady state) | < 256MB | Unknown |

---

## Test Coverage Requirements

| Finding | Required Tests                               |
| ------- | -------------------------------------------- |
| PERF-01 | Render count test, fetch count verification  |
| PERF-03 | Load test with high unique key count         |
| MEM-01  | Memory profiling under sustained logout load |
| API-01  | Query performance benchmarks                 |
| ARCH-01 | Multi-instance deployment test               |
