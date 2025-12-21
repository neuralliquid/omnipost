# Audit Findings — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Executive Summary

This document captures bugs, issues, and security concerns identified during the Phase 4 deep audit of the OmniPost codebase. Each finding includes severity, impact, evidence, and recommended remediation.

**Critical Issues:** 3 | **High Priority:** 5 | **Medium Priority:** 4 | **Total:** 12

---

## Bug Registry

### Critical Bugs

#### BUG-01: Broken API Endpoints in Content Review Flow

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| **ID**         | BUG-01                                      |
| **Severity**   | Critical                                    |
| **Impact**     | Content approval workflow completely broken |
| **Effort**     | S (Small)                                   |
| **File**       | `hooks/useReviewProcess.ts`                 |
| **Lines**      | 96, 112, 116                                |
| **Root Cause** | Incorrect endpoint references               |

**Description:**
The `useReviewProcess` hook references non-existent API endpoints:

- Line 96: `/api/generate-image` should be `/api/images`
- Line 112: `/api/approve-content` endpoint does not exist
- Line 116: Logs sensitive response data to console

**Evidence:**

```typescript
// Line 96 - WRONG ENDPOINT
const response = await axios.post<ImageApiResponse>('/api/generate-image', { context: summary });

// Line 112 - ENDPOINT DOESN'T EXIST
const response = await axios.post<ApproveApiResponse>('/api/approve-content', { summary, image });

// Line 116 - LOGS SENSITIVE DATA
console.log('Content approved:', response.data);
```

**Test Coverage Required:**

- Unit test for endpoint URL correctness
- Integration test for complete review flow
- E2E test for content approval workflow

---

#### BUG-02: Missing Null/Undefined Checks in ContentManager

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| **ID**         | BUG-02                                       |
| **Severity**   | Critical                                     |
| **Impact**     | Runtime crashes, potential XSS vulnerability |
| **Effort**     | M (Medium)                                   |
| **File**       | `components/content/ContentManager.tsx`      |
| **Lines**      | 34-39, 166-175                               |
| **Root Cause** | Insufficient data validation before access   |

**Description:**

- Line 34-39: `result?.data` accessed without validating structure
- Line 171: `new Date(item.createdTime)` without null check
- Line 168: `item.Content` rendered without sanitization

**Evidence:**

```typescript
// Lines 34-39 - No structure validation
if (result?.data) {
  setContent(result.data);
  setHasMore(result.pagination?.hasMorePages || false);
}

// Line 168 - No sanitization (XSS risk)
<p className="whitespace-pre-wrap">{item.Content}</p>

// Line 171 - Potential crash
{new Date(item.createdTime).toLocaleString()}
```

**Test Coverage Required:**

- Unit tests for null/undefined data handling
- Security test for XSS via Content field
- Integration test with malformed API responses

---

#### BUG-03: Async/Await Pattern Issue in AuthService

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| **ID**         | BUG-03                                |
| **Severity**   | Critical                              |
| **Impact**     | Authentication may fail silently      |
| **Effort**     | M (Medium)                            |
| **File**       | `lib/auth/auth-service.ts`            |
| **Lines**      | 97-102                                |
| **Root Cause** | Synchronous access to async functions |

**Description:**
The `getCurrentUser()` method uses `cookies()` and `headers()` synchronously, but these return Promises in Next.js 14+. Type casting with `as any` hides the issue.

**Evidence:**

```typescript
public getCurrentUser(): User | null {
  try {
    const cookieStore = cookies();  // Returns Promise!
    const tokenFromCookie = (cookieStore as any).get?.('auth-token')?.value;  // Type bypass
    const headersList = headers();  // Returns Promise!
```

**Test Coverage Required:**

- Unit test verifying async handling
- Integration test for auth state persistence
- E2E test for login/logout flow

---

### High Priority Bugs

#### BUG-04: Missing Error Boundaries

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| **ID**         | BUG-04                                    |
| **Severity**   | High                                      |
| **Impact**     | Single component error crashes entire app |
| **Effort**     | M (Medium)                                |
| **Files**      | Multiple component files                  |
| **Root Cause** | No granular error isolation               |

**Affected Files:**

- `components/review/ParsingStage.tsx` (line 6)
- `app/(dashboard)/dashboard/page.tsx`

**Test Coverage Required:**

- Unit tests for error boundary behavior
- Integration tests for error recovery

---

#### BUG-05: Stack Trace Exposure in Notifications

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| **ID**         | BUG-05                                     |
| **Severity**   | High                                       |
| **Impact**     | Security vulnerability - internal exposure |
| **Effort**     | S (Small)                                  |
| **File**       | `app/api/notifications/route.ts`           |
| **Lines**      | 136                                        |
| **Root Cause** | Overly verbose error logging               |

**Evidence:**

```typescript
stack: (serviceError as Error).stack; // EXPOSES INTERNAL DETAILS
```

**Test Coverage Required:**

- Unit test verifying no stack trace in responses
- Security scan for sensitive data exposure

---

#### BUG-06: Race Condition in Rate Limiting

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| **ID**         | BUG-06                                      |
| **Severity**   | High                                        |
| **Impact**     | Rate limiting bypasses under load           |
| **Effort**     | L (Large)                                   |
| **File**       | `app/api/_utils/rateLimit.ts`               |
| **Lines**      | 203-210                                     |
| **Root Cause** | Non-atomic operations in concurrent context |

**Evidence:**

```typescript
if (now - lastCleanup > 60_000) {
  lastCleanup = now;
  for (const [entryKey, entry] of rateLimitStore.entries()) {
    // NOT ATOMIC
    if (entry.resetTime < now) {
      rateLimitStore.delete(entryKey); // Could race with concurrent access
    }
  }
}
```

**Test Coverage Required:**

- Load test with concurrent requests
- Integration test for rate limit consistency

---

#### BUG-07: Overly Restrictive Feature Flag Check

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| **ID**         | BUG-07                                 |
| **Severity**   | High                                   |
| **Impact**     | Parse endpoint unusable in development |
| **Effort**     | S (Small)                              |
| **File**       | `app/api/parse/route.ts`               |
| **Lines**      | 41-57                                  |
| **Root Cause** | All flags required instead of relevant |

**Evidence:**

```typescript
const requiredFlags = [
  { flag: featureFlags.textParser?.enabled, name: 'Text parser' },
  { flag: featureFlags.trigger.cron.enabled, name: 'CRON trigger' },
  { flag: featureFlags.trigger.rss.enabled, name: 'RSS trigger' },
  { flag: featureFlags.scraping.enabled, name: 'Scraping' }, // NOT NEEDED FOR PARSE
  { flag: featureFlags.storage.notion.enabled, name: 'Notion storage' }, // NOT NEEDED
  { flag: featureFlags.writing.openai.enabled, name: 'OpenAI writing' }, // NOT NEEDED
  { flag: featureFlags.distribution.telegram.enabled, name: 'Telegram distribution' }, // NOT NEEDED
];
```

---

#### BUG-08: Missing Null Check in Token Verification

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| **ID**         | BUG-08                                    |
| **Severity**   | High                                      |
| **Impact**     | Potential null pointer exceptions         |
| **Effort**     | S (Small)                                 |
| **File**       | `lib/auth/auth-service.ts`                |
| **Lines**      | 79-80                                     |
| **Root Cause** | Missing validation before property access |

---

### Medium Priority Bugs

#### BUG-09: Unvalidated Feature Flag Implementation Access

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| **ID**         | BUG-09                                                              |
| **Severity**   | Medium                                                              |
| **Impact**     | Undefined behavior if config missing                                |
| **Effort**     | S (Small)                                                           |
| **Files**      | `app/api/parse/route.ts` (104, 111), `app/api/images/route.ts` (36) |
| **Root Cause** | Assumed object existence                                            |

---

#### BUG-10: Silent 401 Redirect Without User Warning

| Field          | Value                              |
| -------------- | ---------------------------------- |
| **ID**         | BUG-10                             |
| **Severity**   | Medium                             |
| **Impact**     | Data loss, poor UX                 |
| **Effort**     | S (Small)                          |
| **File**       | `lib/api-client.ts`                |
| **Lines**      | 64-69                              |
| **Root Cause** | No user notification before action |

---

#### BUG-11: Missing Scheduler Timestamp Validation

| Field          | Value                           |
| -------------- | ------------------------------- |
| **ID**         | BUG-11                          |
| **Severity**   | Medium                          |
| **Impact**     | Invalid dates could be accepted |
| **Effort**     | S (Small)                       |
| **File**       | `app/api/scheduler/route.ts`    |
| **Lines**      | 76-80                           |
| **Root Cause** | Presence-only validation        |

---

#### BUG-12: ContentManager Pagination State Mismatch

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| **ID**         | BUG-12                                  |
| **Severity**   | Medium                                  |
| **Impact**     | Potential infinite loops                |
| **Effort**     | M (Medium)                              |
| **File**       | `components/content/ContentManager.tsx` |
| **Lines**      | 25-32, 50-52                            |
| **Root Cause** | Improper useCallback dependencies       |

---

## Shared Root Causes

| Root Cause ID | Description                       | Related Findings       |
| ------------- | --------------------------------- | ---------------------- |
| RC-01         | Missing input validation          | BUG-02, BUG-09, BUG-11 |
| RC-02         | Async/await pattern misuse        | BUG-03, BUG-08         |
| RC-03         | In-memory state management issues | BUG-06, BUG-12         |
| RC-04         | Configuration assumptions         | BUG-07, BUG-09         |

---

## Priority Summary

| Priority | Count | Action                   |
| -------- | ----- | ------------------------ |
| Critical | 3     | Fix immediately          |
| High     | 5     | Fix before next release  |
| Medium   | 4     | Schedule for next sprint |

---

## Test Coverage Recommendations

Each bug requires the following minimum test coverage before marking as resolved:

1. **Unit test** covering the specific fix
2. **Regression test** to prevent reintroduction
3. **Integration test** validating the complete flow
4. **Security test** where applicable (BUG-02, BUG-05)
