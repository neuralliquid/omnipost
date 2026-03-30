# Issues & Technical Debt — OmniPost

> **Audit Date:** December 2024
> **Updated:** March 2026

---

## Summary

| Category        | Count | Priority            |
| --------------- | ----- | ------------------- |
| Critical Bugs   | 3     | Fix immediately     |
| High Priority   | 5     | Fix before release  |
| Medium Priority | 4     | Schedule for sprint |
| Technical Debt  | 14    | See roadmap         |

---

## Critical Bugs

### BUG-01: Broken API Endpoints ✅ FIXED

- **File:** `hooks/useReviewProcess.ts`
- **Issue:** `/api/approve-content` referenced non-existent endpoint
- **Status:** Fixed — now uses `/api/queue/approve`

### BUG-02: XSS & Null Check Issues ✅ FIXED

- **File:** `components/content/ContentManager.tsx`
- **Issue:** Missing sanitization and null checks
- **Status:** Fixed — added sanitization and validation

### BUG-03: Async/Await Pattern ✅ FIXED

- **File:** `lib/auth/auth-service.ts`
- **Issue:** `getCurrentUser()` was sync but used async APIs
- **Status:** Fixed — converted to async

---

## High Priority Bugs

### BUG-04: Missing Error Boundaries ✅ FIXED

- **Files:** `app/(dashboard)/layout.tsx`, `app/(marketing)/layout.tsx`
- **Issue:** Single component error crashed entire app
- **Status:** Fixed — wrapped both layouts with ErrorBoundary component

### BUG-05: Stack Trace Exposure ✅ FIXED

- **File:** `app/api/_utils/errors.ts`
- **Status:** Fixed — production responses sanitized

### BUG-06: Rate Limiting Race Condition ✅ FIXED

- **File:** `app/api/_utils/rateLimit.ts`
- **Issue:** FIFO eviction allowed attackers to flush rate-limited entries by flooding from many IPs
- **Status:** Fixed — rate-limit-aware eviction that never evicts entries actively blocking abusers

### BUG-07: Overly Restrictive Feature Flags ✅ FIXED

- **File:** `app/api/parse/route.ts`
- **Issue:** Parse endpoint required unrelated flags (scraping, notion, telegram)
- **Status:** Fixed — validateFeatureFlags() now only checks textParser.enabled

### BUG-08: Missing Token Null Check ✅ FIXED

- **File:** `lib/auth/auth-service.ts`
- **Issue:** verifyToken() didn't validate decoded payload structure
- **Status:** Fixed — added null/type checks and required field validation

### BUG-09: Missing Auth Middleware ✅ FIXED

- **File:** `middleware.ts` (new)
- **Issue:** No Next.js middleware to inject x-user-id/x-user-name/x-user-role headers from JWT
- **Status:** Fixed — created root middleware.ts that validates JWT and sets identity headers

---

## Technical Debt Roadmap

### Phase 1: Security

- [ ] **TD-04:** Implement bcrypt password hashing
- [x] **TD-08:** Add health check endpoint

### Phase 2: Testing

- [ ] **TD-05:** Implement E2E tests (Playwright)
- [x] **TD-07:** Add accessibility testing (jest-axe)
- [ ] **TD-06:** Configure visual regression

### Phase 3: Observability

- [ ] **TD-09:** Integrate Application Insights
- [ ] **TD-11:** Set up centralized logging
- [ ] **TD-10:** Add request tracing

### Phase 4: Performance

- [ ] **TD-03:** Complete API migration (50% done)
- [ ] **TD-13:** Configure bundle analyzer
- [ ] **TD-14:** Implement SWR/React Query caching
- [ ] **TD-12:** Add skip links (WCAG 2.4.1)

---

## Metrics

| Metric          | Current | Target              |
| --------------- | ------- | ------------------- |
| Test coverage   | ~47%    | 80%+                |
| E2E coverage    | 0%      | 100% critical paths |
| API migration   | 50%     | 100%                |
| WCAG compliance | Partial | AA                  |
