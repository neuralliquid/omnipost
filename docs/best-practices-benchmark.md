# Best-Practices Benchmark — OmniPost

> **Document Status:** Phase 3 Discovery Output
> **Purpose:** Industry benchmark for evaluating OmniPost against best practices
> **Stack:** Next.js 16+ / React 19+ / TypeScript 5.3+ / Azure

---

## Purpose

This document establishes **industry best-practices benchmarks** for each technology identified in Phase 2. These standards derive from official framework documentation, OWASP guidelines, and widely-adopted patterns. Recommendations focus on practices that materially affect security, stability, or developer velocity.

---

## Table of Contents

1. [Next.js Framework Patterns](#1-nextjs-framework-patterns)
2. [React Component Patterns](#2-react-component-patterns)
3. [TypeScript Patterns](#3-typescript-patterns)
4. [Security & OWASP Guidelines](#4-security--owasp-guidelines)
5. [Performance Optimization](#5-performance-optimization)
6. [Testing Strategies](#6-testing-strategies)
7. [Documentation Standards](#7-documentation-standards)
8. [Architectural Patterns](#8-architectural-patterns)
9. [Accessibility (WCAG 2.1 AA)](#9-accessibility-wcag-21-aa)
10. [DevOps & Deployment](#10-devops--deployment)
11. [Error Handling & Logging](#11-error-handling--logging)

---

## 1. Next.js Framework Patterns

### Routing & Data Fetching

| Practice                           | Standard                                    | Priority |
| ---------------------------------- | ------------------------------------------- | -------- |
| Use App Router for new development | Complete migration from Pages Router        | High     |
| Server Components by default       | Client Components only when necessary       | High     |
| Use Route Handlers                 | `app/api/*/route.ts` with typed responses   | High     |
| Middleware for cross-cutting       | Auth, redirects, headers in `middleware.ts` | High     |
| Error boundaries                   | Implement `error.tsx` and `not-found.tsx`   | High     |
| Loading states                     | Use `loading.tsx` for Suspense boundaries   | Medium   |
| Metadata API                       | Use for SEO in App Router                   | Medium   |

### Rendering & Optimization

| Practice              | Standard                             | Priority |
| --------------------- | ------------------------------------ | -------- |
| SSR/SSG/ISR selection | Based on data freshness requirements | Medium   |
| Image optimization    | Use `next/image` with proper sizing  | Medium   |
| Font optimization     | Use `next/font` for web fonts        | Low      |
| Dynamic imports       | Use `next/dynamic` for large modules | Medium   |

### CI Integration

| Check              | Enforcement                          | Gate  |
| ------------------ | ------------------------------------ | ----- |
| Type check         | `tsc --noEmit` in CI                 | Block |
| Build verification | `next build` must succeed            | Block |
| Bundle analysis    | Monitor with `@next/bundle-analyzer` | Warn  |

---

## 2. React Component Patterns

### Component Design

| Practice                | Standard                                  | Priority |
| ----------------------- | ----------------------------------------- | -------- |
| Function components     | Prefer over class components              | High     |
| Named exports           | Prefer over default exports               | Medium   |
| Props typing            | Define TypeScript interfaces              | High     |
| Hooks for state/effects | useState, useEffect, useCallback, useMemo | High     |
| React Strict Mode       | Enable in development                     | High     |

### Performance Patterns

| Practice             | Standard                               | Priority |
| -------------------- | -------------------------------------- | -------- |
| Memoization          | `React.memo()` for expensive renders   | Medium   |
| Callback memoization | `useCallback()` for stable references  | Medium   |
| Value memoization    | `useMemo()` for expensive computations | Medium   |
| Key stability        | Use stable, unique keys (never index)  | High     |
| Effect minimization  | Prefer server-side data fetching       | Medium   |

### State Management

| State Type   | Recommended Pattern         | Priority |
| ------------ | --------------------------- | -------- |
| UI State     | useState (colocated)        | High     |
| Form State   | useState or react-hook-form | Medium   |
| Server State | SWR, React Query, or fetch  | Medium   |
| Global State | Context API or Zustand      | Low      |
| URL State    | Next.js router              | High     |

---

## 3. TypeScript Patterns

### Configuration

| Setting                  | Standard                 | Priority |
| ------------------------ | ------------------------ | -------- |
| Strict mode              | Enable all strict checks | High     |
| noImplicitAny            | true                     | High     |
| strictNullChecks         | true                     | High     |
| noUncheckedIndexedAccess | true (recommended)       | Medium   |

### Type Practices

| Practice              | Standard                               | Priority |
| --------------------- | -------------------------------------- | -------- |
| Avoid `any`           | Use `unknown` or proper types          | High     |
| Explicit return types | For public APIs and functions          | High     |
| Interface vs Type     | Interface for objects, type for unions | Medium   |
| Utility types         | Use Partial, Pick, Omit, Record        | Medium   |
| Type inference        | Let TypeScript infer when obvious      | Medium   |
| Discriminated unions  | For type-safe conditionals             | Medium   |

---

## 4. Security & OWASP Guidelines

### OWASP Top 10 Alignment

| Risk                           | Best Practice                                  | Implementation  |
| ------------------------------ | ---------------------------------------------- | --------------- |
| A01: Broken Access Control     | RBAC, server-side permission validation        | Middleware      |
| A02: Cryptographic Failures    | Strong encryption, secure key management       | Key Vault       |
| A03: Injection                 | Parameterized queries, validate/sanitize input | Zod + DOMPurify |
| A04: Insecure Design           | Threat modeling, secure defaults               | CSP, headers    |
| A05: Security Misconfiguration | Minimal permissions, disable debug in prod     | Env config      |
| A06: Vulnerable Components     | Regular dependency updates, audit              | npm audit       |
| A07: Auth Failures             | MFA, secure sessions, rate limiting            | JWT + limits    |
| A08: Software/Data Integrity   | Verify dependencies, secure CI/CD              | npm ci          |
| A09: Logging Failures          | Log security events, protect logs              | Audit logging   |
| A10: SSRF                      | Validate URLs, allowlist domains               | URL sanitize    |

### Authentication Standards

| Practice             | Standard                          |
| -------------------- | --------------------------------- |
| JWT expiration       | 1 hour access, 7 days refresh     |
| Token storage        | HttpOnly cookies in production    |
| Password hashing     | bcrypt with cost factor 12+       |
| Session invalidation | Token blacklist on logout         |
| Rate limiting        | 5 attempts per 15 minutes on auth |
| RBAC implementation  | Check permissions per endpoint    |

### Input Handling

| Practice               | Implementation                 |
| ---------------------- | ------------------------------ |
| Server-side validation | Zod schemas                    |
| HTML sanitization      | DOMPurify                      |
| File upload validation | Type, size, content checks     |
| URL sanitization       | Protocol and domain allowlists |
| Output escaping        | React handles by default       |

### Security Headers

| Header                    | Value                                        |
| ------------------------- | -------------------------------------------- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options           | DENY                                         |
| X-Content-Type-Options    | nosniff                                      |
| Content-Security-Policy   | Restrictive policy                           |
| Referrer-Policy           | strict-origin-when-cross-origin              |
| Permissions-Policy        | Restrict sensitive APIs                      |

---

## 5. Performance Optimization

### Bundle Size Targets

| Metric            | Target                 |
| ----------------- | ---------------------- |
| First Load JS     | < 100KB per route      |
| Total bundle size | < 500KB gzipped        |
| Tree shaking      | Automatic with Next.js |
| Dynamic imports   | For modules > 50KB     |

### Core Web Vitals

| Metric                         | Target (75th percentile) |
| ------------------------------ | ------------------------ |
| LCP (Largest Contentful Paint) | < 2.5s                   |
| FID (First Input Delay)        | < 100ms                  |
| CLS (Cumulative Layout Shift)  | < 0.1                    |
| TTFB (Time to First Byte)      | < 800ms                  |

### API Performance

| Metric                         | Target                       |
| ------------------------------ | ---------------------------- |
| Response time (simple queries) | < 200ms                      |
| Response time (complex/AI)     | < 2000ms                     |
| Database queries               | Use indexes, limit fields    |
| Rate limiting                  | Protect expensive operations |

---

## 6. Testing Strategies

### Coverage Standards

| Layer             | Minimum        | Target                   |
| ----------------- | -------------- | ------------------------ |
| Unit Tests        | 70%            | 90%                      |
| Integration Tests | 50%            | 70%                      |
| E2E Tests         | Critical paths | Happy paths + edge cases |
| Overall           | 70%            | 80%+                     |

### Test Types & Tools

| Type              | Tool                  | Focus                     |
| ----------------- | --------------------- | ------------------------- |
| Unit              | Jest                  | Pure functions, utilities |
| Component         | React Testing Library | User interactions, a11y   |
| API               | Supertest/fetch       | Route handlers            |
| Integration       | Jest + RTL            | Component + API           |
| E2E               | Playwright/Cypress    | Critical user journeys    |
| Visual Regression | Chromatic/Percy       | UI consistency            |

### Testing Practices

| Practice               | Description                       |
| ---------------------- | --------------------------------- |
| Test behavior          | Focus on user-facing outcomes     |
| Mock external services | Isolate tests from third parties  |
| Realistic test data    | Factories/fixtures over hardcoded |
| Test error states      | Handle failures gracefully        |
| Test accessibility     | Use jest-axe for a11y checks      |
| Keep tests fast        | < 10s unit, < 60s integration     |

### CI Integration

| Check               | Threshold   | Gate  |
| ------------------- | ----------- | ----- |
| Test pass rate      | 100%        | Block |
| Coverage            | > 70%       | Block |
| Coverage regression | No decrease | Warn  |

---

## 7. Documentation Standards

### Code Documentation

| Type             | Standard                         |
| ---------------- | -------------------------------- |
| Function docs    | JSDoc/TSDoc for public APIs      |
| Complex logic    | Inline comments explaining "why" |
| API endpoints    | OpenAPI/Swagger spec             |
| Type definitions | Self-documenting interfaces      |

### Project Documentation

| Document        | Purpose                 | Location  |
| --------------- | ----------------------- | --------- |
| README.md       | Project overview, setup | Root      |
| CONTRIBUTING.md | Contribution guidelines | Root      |
| ARCHITECTURE.md | System design           | /docs     |
| API.md          | API reference           | /docs/api |
| CHANGELOG.md    | Version history         | Root      |
| ADRs            | Architecture decisions  | /docs/adr |

### API Documentation

| Element                | Requirement             |
| ---------------------- | ----------------------- |
| Endpoint description   | Clear purpose statement |
| Request/response types | TypeScript interfaces   |
| Error responses        | Documented error codes  |
| Examples               | cURL and code examples  |
| Authentication         | Required auth noted     |

---

## 8. Architectural Patterns

### Recommended for This Stack

| Pattern                 | Use Case                              |
| ----------------------- | ------------------------------------- |
| Feature-Based Structure | Group by domain/feature               |
| Repository Pattern      | Abstract data access layer            |
| Service Layer           | Separate business logic from handlers |
| Middleware Chain        | Cross-cutting concerns                |
| Factory Pattern         | Test fixtures, configs                |
| Strategy Pattern        | Feature flag implementations          |

### Layer Separation

| Layer          | Responsibility             |
| -------------- | -------------------------- |
| Presentation   | Components, Pages, Hooks   |
| Application    | API Routes, Controllers    |
| Domain         | Business Logic, Services   |
| Infrastructure | Data Access, External APIs |

### Design Principles

| Principle                    | Application                          |
| ---------------------------- | ------------------------------------ |
| Single Responsibility        | Each module has one reason to change |
| Dependency Injection         | Pass dependencies, don't hardcode    |
| Interface Segregation        | Small, focused interfaces            |
| Open/Closed                  | Extend behavior without modification |
| Composition over Inheritance | Prefer composition                   |

---

## 9. Accessibility (WCAG 2.1 AA)

### Compliance Requirements

| Principle      | Requirements                                |
| -------------- | ------------------------------------------- |
| Perceivable    | Text alternatives, captions, contrast 4.5:1 |
| Operable       | Keyboard accessible, no seizure triggers    |
| Understandable | Readable, predictable, input assistance     |
| Robust         | Compatible with assistive technologies      |

### React Implementation

| Practice         | Implementation                           |
| ---------------- | ---------------------------------------- |
| Semantic HTML    | Use correct elements (button, nav, main) |
| ARIA labels      | When semantic HTML insufficient          |
| Focus management | Logical tab order, visible focus         |
| Skip links       | Allow skipping navigation                |
| Form labels      | Associate labels with inputs             |
| Error messages   | Clear, accessible feedback               |
| Color contrast   | 4.5:1 normal text, 3:1 large text        |

### Testing Tools

| Tool                   | Purpose                          |
| ---------------------- | -------------------------------- |
| jest-axe               | Automated a11y testing           |
| eslint-plugin-jsx-a11y | Lint for a11y issues             |
| Lighthouse             | Audit a11y score                 |
| Screen readers         | Manual testing (NVDA, VoiceOver) |

---

## 10. DevOps & Deployment

### CI/CD Pipeline Standards

| Stage      | Checks                    | Gate       |
| ---------- | ------------------------- | ---------- |
| Install    | pnpm install (lockfile)   | Block      |
| Lint       | ESLint, Prettier          | Block      |
| Type Check | tsc --noEmit              | Block      |
| Test       | Jest (unit + integration) | Block      |
| Build      | next build                | Block      |
| Security   | npm audit                 | Warn/Block |
| Deploy     | Environment-specific      | -          |

### Azure Web Apps Standards

| Practice               | Implementation            |
| ---------------------- | ------------------------- |
| Infrastructure as Code | Bicep templates           |
| Environment separation | dev/test/prod resources   |
| Secrets management     | Azure Key Vault           |
| Application Insights   | Performance monitoring    |
| Auto-scaling           | CPU/memory-based rules    |
| Health checks          | /api/health endpoint      |
| Deployment slots       | Staging before production |

### Environment Management

| Environment | Purpose                            |
| ----------- | ---------------------------------- |
| Development | Local, debug enabled               |
| Test        | Automated testing, mocked services |
| Staging     | Pre-production, internal access    |
| Production  | Live users, hardened, monitored    |

---

## 11. Error Handling & Logging

### Error Handling Standards

| Layer             | Strategy                                  |
| ----------------- | ----------------------------------------- |
| API Routes        | Try-catch with standardized responses     |
| Components        | Error boundaries for graceful degradation |
| Async Operations  | Proper promise rejection handling         |
| External Services | Retry with exponential backoff            |
| Validation        | Return actionable error messages          |

### Error Response Format

```typescript
interface ErrorResponse {
  message: string; // Human-readable
  code: string; // Machine-readable (e.g., "AUTH_REQUIRED")
  details?: unknown; // Validation errors
  requestId?: string; // For tracing
  timestamp: string; // ISO 8601
}
```

### Logging Standards

| Level | Use Case            |
| ----- | ------------------- |
| ERROR | Unexpected failures |
| WARN  | Recoverable issues  |
| INFO  | Business events     |
| DEBUG | Development info    |

### Audit Logging Requirements

| Event Type        | Required Fields                          |
| ----------------- | ---------------------------------------- |
| Authentication    | user, action, timestamp, IP, success     |
| Data Access       | user, resource, action, timestamp        |
| Data Modification | user, resource, before, after, timestamp |
| Security Events   | event type, details, timestamp, severity |

### Sensitive Data Handling

| Data Type      | Logging Rule            |
| -------------- | ----------------------- |
| Passwords      | Never log               |
| Tokens         | Mask or omit            |
| PII            | Hash or redact          |
| API Keys       | Never log               |
| Request bodies | Sanitize before logging |

---

## Evaluation Criteria Summary

### High Priority (Must Have)

- [ ] TypeScript strict mode enabled
- [ ] JWT authentication with proper expiration
- [ ] Input validation and sanitization
- [ ] Rate limiting on sensitive endpoints
- [ ] Security headers configured
- [ ] Error boundaries implemented
- [ ] CI/CD pipeline with quality gates
- [ ] Test coverage > 70%
- [ ] No high/critical npm vulnerabilities
- [ ] RBAC for protected routes

### Medium Priority (Should Have)

- [ ] App Router migration complete
- [ ] Server Components utilized appropriately
- [ ] Performance optimizations (bundle size, images)
- [ ] Comprehensive API documentation
- [ ] Integration tests for critical paths
- [ ] Audit logging for security events
- [ ] Environment-based configuration
- [ ] Feature-based code organization
- [ ] Semantic HTML and basic accessibility

### Low Priority (Nice to Have)

- [ ] E2E tests for user journeys
- [ ] Visual regression testing
- [ ] WCAG 2.1 AA compliance verified
- [ ] ADR documentation
- [ ] Health check endpoint
- [ ] Application monitoring/APM
- [ ] Blue-green deployments
- [ ] Automated dependency updates

---

## Internal Reasoning Notes

**Key Assumptions:**

- Standards derived from official framework documentation (Next.js, React, TypeScript)
- Security standards aligned with OWASP Top 10 2021
- Performance targets based on Core Web Vitals guidelines
- Testing coverage targets based on industry norms for production applications

**Excluded Recommendations:**

- Framework rewrites (explicitly excluded per prompt)
- Speculative optimizations (excluded per prompt)
- Technology replacements unless security-critical

**Confidence Drivers:**

- Framework best practices from official documentation (High confidence)
- OWASP guidelines are industry standard (High confidence)
- Testing targets are commonly accepted thresholds (Medium-High confidence)
- Accessibility standards from W3C (High confidence)
