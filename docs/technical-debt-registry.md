# Technical Debt Registry — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Executive Summary

This document provides a systematic audit of incomplete implementations, technical debt markers, and unresolved issues in the OmniPost codebase.

**In-Code Markers:** 5 | **Incomplete Features:** 12 | **Migration Debt:** 3 | **Testing Debt:** 4 | **Total Items:** 24

---

## In-Code Technical Debt Markers

### TD-01: Math.random() Usage Notes

| Field      | Value                            |
| ---------- | -------------------------------- |
| **ID**     | TD-01                            |
| **Type**   | Intentional Design Decision      |
| **Impact** | Low (documented and intentional) |
| **Effort** | N/A                              |

**Locations:**

| File                             | Line | Context                     |
| -------------------------------- | ---- | --------------------------- |
| `lib/scheduler/adapters.ts`      | 118  | Development simulation only |
| `lib/scheduler/retry-handler.ts` | 227  | Jitter for retry timing     |
| `lib/scheduler/queue.ts`         | 283  | Internal job IDs            |
| `lib/utils/retry.ts`             | 127  | Jitter for retry timing     |

**Status:** No action required - documented intentional usage.

---

### TD-02: node-fetch ESM Import Issue

| Field      | Value                                           |
| ---------- | ----------------------------------------------- |
| **ID**     | TD-02                                           |
| **Type**   | TODO                                            |
| **Impact** | Medium (affects test suite)                     |
| **Effort** | S (Small)                                       |
| **File**   | `docs/analysis/scores/10-TESTING.md` (line 188) |

**Description:**
Test configuration has unresolved ESM import issue with node-fetch.

**Recommended Action:**
Configure Jest to handle ESM modules or use native fetch in Node.js 18+.

---

## Incomplete Features

### TD-03: API Router Migration Incomplete

| Field      | Value                             |
| ---------- | --------------------------------- |
| **ID**     | TD-03                             |
| **Type**   | Migration Debt                    |
| **Impact** | High (maintenance complexity)     |
| **Effort** | L (Large)                         |
| **Source** | `docs/ARCHITECTURE.md` (line 478) |

**Description:**
API routes are only 50% migrated from Pages Router to App Router, creating hybrid architecture maintenance burden.

**Current State:**

| Category         | App Router | Pages Router |
| ---------------- | ---------- | ------------ |
| Content APIs     | ✅         | —            |
| Auth APIs        | ✅         | —            |
| Legacy endpoints | —          | ✅           |

**Recommended Action:**
Complete migration per `docs/api/api-migration-todo.md`.

---

### TD-04: Mock Authentication System

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-04                                                |
| **Type**   | Security Debt                                        |
| **Impact** | Critical (not production-ready)                      |
| **Effort** | M (Medium)                                           |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
Password authentication uses plaintext comparison (mock auth) instead of proper password hashing.

**Current State:**

- No bcrypt/argon2 password hashing
- Plaintext password comparison
- Development-only security

**Recommended Action:**
Implement bcrypt with cost factor 12+ before production deployment.

---

### TD-05: Missing E2E Test Suite

| Field      | Value                                |
| ---------- | ------------------------------------ |
| **ID**     | TD-05                                |
| **Type**   | Testing Debt                         |
| **Impact** | High (no critical path coverage)     |
| **Effort** | L (Large)                            |
| **Source** | `docs/analysis/scores/10-TESTING.md` |

**Description:**
No end-to-end tests exist. Critical user flows have no automated verification.

**Affected Flows:**

- Authentication flow
- Content creation flow
- Publishing workflow
- Campaign management

**Recommended Action:**
Implement Playwright test suite (see UX/UI tooling section).

---

### TD-06: Missing Visual Regression Tests

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-06                                                |
| **Type**   | Testing Debt                                         |
| **Impact** | Medium (UI changes may break unnoticed)              |
| **Effort** | M (Medium)                                           |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
No Chromatic, Percy, or similar visual regression testing configured.

---

### TD-07: Missing Accessibility Testing

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-07                                                |
| **Type**   | Testing Debt                                         |
| **Impact** | High (WCAG compliance unverified)                    |
| **Effort** | S (Small)                                            |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**

- No jest-axe in dependencies
- No eslint-plugin-jsx-a11y in ESLint config
- WCAG 2.1 AA compliance untested

---

### TD-08: Missing Health Check Endpoint

| Field      | Value                                  |
| ---------- | -------------------------------------- |
| **ID**     | TD-08                                  |
| **Type**   | DevOps Debt                            |
| **Impact** | Medium (monitoring blind spot)         |
| **Effort** | S (Small)                              |
| **Source** | `docs/analysis/stack/06-DEPLOYMENT.md` |

**Description:**
No `/api/health` endpoint for load balancer health checks or monitoring.

**Recommended Implementation:**

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  });
}
```

---

### TD-09: Missing Application Insights Integration

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-09                                                |
| **Type**   | Observability Debt                                   |
| **Impact** | Medium (no production monitoring)                    |
| **Effort** | M (Medium)                                           |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
Azure Application Insights marked as "planned" but not implemented. No APM or error tracking in production.

---

### TD-10: Missing Request Tracing

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-10                                                |
| **Type**   | Observability Debt                                   |
| **Impact** | Medium (debugging difficult)                         |
| **Effort** | S (Small)                                            |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
No requestId correlation for distributed tracing. Logs cannot be correlated across services.

---

### TD-11: Missing Centralized Logging

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-11                                                |
| **Type**   | Observability Debt                                   |
| **Impact** | High (logs lost on restart)                          |
| **Effort** | M (Medium)                                           |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**

- Console-only logging
- No log retention
- No alerting system

---

### TD-12: Missing Skip Links

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-12                                                |
| **Type**   | Accessibility Debt                                   |
| **Impact** | Medium (WCAG 2.4.1 failure)                          |
| **Effort** | S (Small)                                            |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
No skip-to-main-content links for keyboard navigation.

---

### TD-13: Missing Bundle Analysis

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-13                                                |
| **Type**   | Performance Debt                                     |
| **Impact** | Low (unknown bundle composition)                     |
| **Effort** | S (Small)                                            |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**
@next/bundle-analyzer not configured. Bundle size optimization opportunities unknown.

---

### TD-14: Missing Data Caching Strategy

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| **ID**     | TD-14                                                |
| **Type**   | Performance Debt                                     |
| **Impact** | Medium (redundant API calls)                         |
| **Effort** | M (Medium)                                           |
| **Source** | `docs/analysis/PROJECT_IMPLEMENTATION_ASSESSMENT.md` |

**Description:**

- No SWR/React Query for data fetching
- No cache invalidation strategy
- No optimistic updates

---

## Priority Summary

| Priority | Count | Category                            |
| -------- | ----- | ----------------------------------- |
| Critical | 1     | Mock authentication (TD-04)         |
| High     | 5     | E2E tests, a11y, logging, migration |
| Medium   | 6     | Monitoring, tracing, caching        |
| Low      | 2     | Bundle analysis, skip links         |

---

## Debt Repayment Roadmap

### Phase 1: Security Critical

1. **TD-04:** Implement proper password hashing
2. **TD-08:** Add health check endpoint

### Phase 2: Testing Foundation

3. **TD-05:** Implement E2E test suite
4. **TD-07:** Add accessibility testing (jest-axe)
5. **TD-06:** Configure visual regression testing

### Phase 3: Observability

6. **TD-09:** Integrate Application Insights
7. **TD-11:** Set up centralized logging
8. **TD-10:** Add request tracing

### Phase 4: Performance & Polish

9. **TD-13:** Configure bundle analyzer
10. **TD-14:** Implement data caching
11. **TD-12:** Add skip links
12. **TD-03:** Complete API migration

---

## Tracking & Metrics

| Metric                   | Current | Target              |
| ------------------------ | ------- | ------------------- |
| Critical debt items      | 1       | 0                   |
| High priority items      | 5       | 0                   |
| Test coverage            | ~47%    | 80%+                |
| E2E test coverage        | 0%      | 100% critical paths |
| WCAG compliance          | Unknown | AA                  |
| API migration completion | 50%     | 100%                |
