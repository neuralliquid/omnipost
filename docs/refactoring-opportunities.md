# Refactoring Opportunities — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Executive Summary

This document captures refactoring opportunities identified during the Phase 4 audit, focusing on code duplication, complexity reduction, naming improvements, and pattern consistency.

**Duplication Issues:** 3 | **Complexity Issues:** 3 | **Naming Issues:** 2 | **Pattern Issues:** 2 | **Total:** 10

---

## Code Duplication

### REFACTOR-01: Duplicate Input Validation Logic

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| **ID**       | REFACTOR-01                               |
| **Severity** | Medium                                    |
| **Impact**   | Maintenance burden, inconsistent behavior |
| **Effort**   | S (Small)                                 |
| **Files**    | Multiple API routes                       |

**Affected Files:**

- `app/api/parse/route.ts` (lines 82-86)
- `app/api/images/route.ts` (lines 29-33)
- `app/api/summarize/route.ts` (lines 122-125)
- `app/api/leads/route.ts` (lines 45-50)
- `app/api/scheduler/route.ts` (lines 76-80)
- `app/api/notifications/route.ts` (lines 58-62)
- `app/api/campaigns/route.ts` (lines 42-46)

**Current Pattern:**

```typescript
const validation = validateAndSanitize(schema, body);
if (!validation.success) {
  return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
}
```

**Recommended Fix:**
Create validation middleware:

```typescript
// lib/api/withValidation.ts
export function withValidation<T>(schema: ZodSchema<T>) {
  return async (request: Request, handler: (data: T) => Promise<Response>) => {
    const body = await request.json();
    const validation = validateAndSanitize(schema, body);

    if (!validation.success) {
      return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
    }

    return handler(validation.data);
  };
}
```

---

### REFACTOR-02: Duplicate Error Logging Pattern

| Field        | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **ID**       | REFACTOR-02                                                            |
| **Severity** | Low                                                                    |
| **Impact**   | Inconsistent logging format                                            |
| **Effort**   | S (Small)                                                              |
| **Files**    | `app/api/parse/route.ts`, `app/api/notifications/route.ts`, and others |

**Current Pattern:**

```typescript
const logEntry = await createLogEntry('ACTION', data);
await logToAuditTrail(logEntry);
```

**Recommended Fix:**
Create centralized audit logging utility:

```typescript
// lib/audit/logger.ts
export async function auditLog(action: string, data: AuditData) {
  const entry = await createLogEntry(action, {
    ...data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
  return logToAuditTrail(entry);
}
```

---

### REFACTOR-03: Duplicate Authentication Checks

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| **ID**       | REFACTOR-03                                |
| **Severity** | Medium                                     |
| **Impact**   | Repeated code, potential for inconsistency |
| **Effort**   | M (Medium)                                 |
| **Files**    | All protected API routes                   |

**Current Pattern:**

```typescript
export const POST = withRateLimit(
  async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized();
    }
    // ... handler logic
  },
  '/api/endpoint',
  RateLimitPresets.GENERAL
);
```

**Recommended Fix:**
Create authentication middleware:

```typescript
// lib/api/withAuth.ts
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized();
    }
    return handler(request);
  };
}

// Usage
export const POST = withRateLimit(withAuth(handler), '/api/endpoint', RateLimitPresets.GENERAL);
```

---

## Complex Functions

### REFACTOR-04: Overly Complex ContentManager Component

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| **ID**       | REFACTOR-04                             |
| **Severity** | High                                    |
| **Impact**   | Hard to test, maintain, and understand  |
| **Effort**   | L (Large)                               |
| **File**     | `components/content/ContentManager.tsx` |
| **Lines**    | 14-208 (200+ lines)                     |

**Current Issues:**

- Mixes data fetching, UI state, pagination, filtering, rendering
- Multiple useState hooks (8+)
- Multiple useEffect hooks (3+)
- Inline event handlers

**Recommended Refactor:**

1. Extract pagination logic to custom hook:

   ```typescript
   // hooks/usePagination.ts
   function usePagination(initialPage = 1, initialPageSize = 10) {
     const [page, setPage] = useState(initialPage);
     const [pageSize, setPageSize] = useState(initialPageSize);
     // ... pagination logic
   }
   ```

2. Extract data fetching to custom hook:

   ```typescript
   // hooks/useContent.ts
   function useContent(filter: string, page: number, pageSize: number) {
     // ... fetch logic with SWR or React Query
   }
   ```

3. Extract table rendering to separate component:

   ```typescript
   // components/content/ContentTable.tsx
   function ContentTable({ items, onEdit, onDelete }) {
     // ... table rendering
   }
   ```

---

### REFACTOR-05: Complex Feature Flag Management

| Field        | Value                                |
| ------------ | ------------------------------------ |
| **ID**       | REFACTOR-05                          |
| **Severity** | Medium                               |
| **Impact**   | Type safety issues, hard to maintain |
| **Effort**   | M (Medium)                           |
| **File**     | `lib/featureFlags.ts`                |
| **Lines**    | Throughout                           |

**Current Issues:**

- Mixing boolean flags with complex objects
- `any` type used for dynamic access
- No type safety for nested flags

**Current:**

```typescript
if (featureFlags.trigger.cron.enabled) {
  // Nested access, no validation
}
```

**Recommended Fix:**

```typescript
// Type-safe feature flag access
const canUseCron = getFeatureFlag('trigger.cron.enabled');

// With validation
function getFeatureFlag<T extends keyof FeatureFlags>(path: T): FeatureFlags[T] {
  const value = get(featureFlags, path);
  if (value === undefined) {
    console.warn(`Feature flag ${path} not found`);
    return false as FeatureFlags[T];
  }
  return value;
}
```

---

### REFACTOR-06: Duplicate API Endpoint Structure

| Field        | Value                           |
| ------------ | ------------------------------- |
| **ID**       | REFACTOR-06                     |
| **Severity** | Medium                          |
| **Impact**   | Boilerplate code in every route |
| **Effort**   | L (Large)                       |
| **Files**    | All route handlers              |

**Current Structure (repeated in every endpoint):**

1. Auth check
2. Feature flag check
3. Input validation
4. Logging
5. Business logic
6. Error handling
7. Response formatting

**Recommended Fix:**
Create endpoint builder pattern:

```typescript
// lib/api/createEndpoint.ts
export function createEndpoint<TInput, TOutput>(config: EndpointConfig<TInput, TOutput>) {
  return withRateLimit(
    withErrorHandling(async (request: Request) => {
      // 1. Auth check
      if (config.requireAuth && !(await isAuthenticated())) {
        return Errors.unauthorized();
      }

      // 2. Feature flag check
      if (config.featureFlag && !getFeatureFlag(config.featureFlag)) {
        return Errors.forbidden('Feature not enabled');
      }

      // 3. Input validation
      const body = await request.json();
      const validation = validateAndSanitize(config.schema, body);
      if (!validation.success) {
        return Errors.badRequest(validation.errors);
      }

      // 4. Logging
      await auditLog(config.action, { input: validation.data });

      // 5. Business logic
      const result = await config.handler(validation.data);

      // 6 & 7. Response
      return Response.json({ success: true, data: result });
    }),
    config.path,
    config.rateLimit
  );
}
```

---

## Naming Improvements

### REFACTOR-07: Unclear Variable Names

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| **ID**       | REFACTOR-07                             |
| **Severity** | Low                                     |
| **Impact**   | Reduced code readability                |
| **Effort**   | S (Small)                               |
| **File**     | `components/content/ContentManager.tsx` |

**Current Names → Recommended:**

| Current      | Recommended    | Reason                                |
| ------------ | -------------- | ------------------------------------- |
| `newContent` | `contentInput` | Clarifies it's user input             |
| `result`     | `queryResult`  | Specifies what result represents      |
| `filter`     | `searchTerm`   | Clarifies it's a text search          |
| `items`      | `contentItems` | More descriptive                      |
| `data`       | `responseData` | Distinguishes from other data objects |

---

### REFACTOR-08: Generic Type Names

| Field        | Value                           |
| ------------ | ------------------------------- |
| **ID**       | REFACTOR-08                     |
| **Severity** | Low                             |
| **Impact**   | Reduced type safety and clarity |
| **Effort**   | S (Small)                       |
| **File**     | `lib/api-client.ts`             |

**Current:**

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any; // What are details?
}
```

**Recommended:**

```typescript
interface ApiResponse<TData, TError = ApiErrorDetails> {
  success: boolean;
  data?: TData;
  error?: string;
  details?: TError;
}

interface ApiErrorDetails {
  code: string;
  field?: string;
  message: string;
}
```

---

## Pattern Inconsistencies

### REFACTOR-09: Inconsistent Error Response Structures

| Field        | Value                             |
| ------------ | --------------------------------- |
| **ID**       | REFACTOR-09                       |
| **Severity** | Medium                            |
| **Impact**   | Difficult frontend error handling |
| **Effort**   | M (Medium)                        |
| **Files**    | All API routes                    |

**Current Inconsistencies:**

| Route        | Error Format                      |
| ------------ | --------------------------------- |
| `/api/parse` | `{ error: string }`               |
| `/api/leads` | `{ message: string }`             |
| `/api/auth`  | `{ error: string, code: string }` |
| Others       | `Errors.badRequest()` helper      |

**Recommended Standard:**

```typescript
interface ApiError {
  error: string; // User-friendly message
  code: string; // Machine-readable code
  details?: Record<string, string>; // Field-specific errors
}

// Consistent usage
return Response.json(
  {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: { email: 'Invalid email format' },
  },
  { status: 400 }
);
```

---

### REFACTOR-10: Mixed Async Patterns

| Field        | Value                            |
| ------------ | -------------------------------- |
| **ID**       | REFACTOR-10                      |
| **Severity** | Low                              |
| **Impact**   | Inconsistent error handling      |
| **Effort**   | M (Medium)                       |
| **Files**    | Various components and utilities |

**Current Mix:**

- `async/await` with try/catch
- `.then().catch()` callbacks
- Mixed patterns in same file

**Recommended Standard:**
Always use `async/await` with try/catch:

```typescript
async function fetchData() {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    handleError(error);
    throw error; // Re-throw if caller needs to handle
  }
}
```

---

## Priority Summary

| Priority | Count | Category                        |
| -------- | ----- | ------------------------------- |
| High     | 1     | Complex component (REFACTOR-04) |
| Medium   | 5     | Duplication, patterns           |
| Low      | 4     | Naming, async patterns          |

---

## Recommended Implementation Order

### Sprint 1: Quick Wins

1. Fix variable naming (REFACTOR-07)
2. Fix type names (REFACTOR-08)
3. Standardize async patterns (REFACTOR-10)

### Sprint 2: Middleware Extraction

4. Create validation middleware (REFACTOR-01)
5. Create auth middleware (REFACTOR-03)
6. Centralize audit logging (REFACTOR-02)

### Sprint 3: Complex Refactoring

7. Refactor ContentManager (REFACTOR-04)
8. Improve feature flag system (REFACTOR-05)

### Sprint 4: Architecture

9. Standardize error responses (REFACTOR-09)
10. Create endpoint builder (REFACTOR-06)

---

## Test Coverage Requirements

| Finding     | Required Tests                         |
| ----------- | -------------------------------------- |
| REFACTOR-01 | Unit tests for validation middleware   |
| REFACTOR-03 | Integration tests for auth middleware  |
| REFACTOR-04 | Component tests, hook tests, E2E tests |
| REFACTOR-09 | API contract tests for error formats   |
