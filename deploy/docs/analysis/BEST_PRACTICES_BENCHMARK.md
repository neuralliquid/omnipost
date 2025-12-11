# Best-Practices Benchmark

> **Document Type**: Phase 1b - Best-Practices Research Baseline
> **Last Updated**: December 2025
> **Stack**: Next.js 14+ / React 18+ / TypeScript 5.3+ / Azure

---

## Purpose

This document establishes the **industry best-practices benchmark** for evaluating the OmniPost. These standards are derived from official framework documentation, OWASP guidelines, and widely-adopted patterns for the identified technology stack.

All recommendations in this document will be used as the **reference standard** for subsequent analysis phases.

---

## Table of Contents

1. [Framework-Specific Patterns](#1-framework-specific-patterns)
2. [Security Best Practices](#2-security-best-practices)
3. [Performance Optimization](#3-performance-optimization)
4. [Testing Strategies](#4-testing-strategies)
5. [Documentation Conventions](#5-documentation-conventions)
6. [Architectural Patterns](#6-architectural-patterns)
7. [Accessibility Standards](#7-accessibility-standards)
8. [DevOps & Deployment](#8-devops--deployment)
9. [Code Organization](#9-code-organization)
10. [Dependency Management](#10-dependency-management)
11. [Error Handling & Logging](#11-error-handling--logging)
12. [State Management](#12-state-management)

---

## 1. Framework-Specific Patterns

### Next.js 14+ Best Practices

| Category               | Best Practice                                                            | Priority |
| ---------------------- | ------------------------------------------------------------------------ | -------- |
| **Routing**            | Use App Router for new development; complete migration from Pages Router | High     |
| **Data Fetching**      | Use Server Components by default; Client Components only when necessary  | High     |
| **Rendering**          | Choose SSR/SSG/ISR based on data freshness requirements                  | Medium   |
| **API Routes**         | Use Route Handlers (`app/api/*/route.ts`) with typed responses           | High     |
| **Middleware**         | Use `middleware.ts` for authentication, redirects, headers               | High     |
| **Image Optimization** | Use `next/image` for all images with proper sizing                       | Medium   |
| **Font Optimization**  | Use `next/font` for web fonts                                            | Low      |
| **Metadata**           | Use Metadata API for SEO in App Router                                   | Medium   |
| **Error Handling**     | Implement `error.tsx` and `not-found.tsx` boundaries                     | High     |
| **Loading States**     | Use `loading.tsx` for Suspense boundaries                                | Medium   |

### React 18+ Best Practices

| Category                | Best Practice                                                  | Priority |
| ----------------------- | -------------------------------------------------------------- | -------- |
| **Components**          | Prefer function components with hooks                          | High     |
| **Memoization**         | Use `React.memo()`, `useMemo()`, `useCallback()` appropriately | Medium   |
| **Keys**                | Use stable, unique keys for list items (never index)           | High     |
| **Effects**             | Minimize useEffect; prefer server-side data fetching           | Medium   |
| **State**               | Lift state only when necessary; colocate state with usage      | Medium   |
| **Refs**                | Use refs for DOM access, not for state                         | High     |
| **Strict Mode**         | Enable React Strict Mode in development                        | High     |
| **Concurrent Features** | Utilize Suspense, startTransition for better UX                | Low      |

### TypeScript Best Practices

| Category                 | Best Practice                                         | Priority |
| ------------------------ | ----------------------------------------------------- | -------- |
| **Strict Mode**          | Enable all strict checks in `tsconfig.json`           | High     |
| **Type Inference**       | Let TypeScript infer types when obvious               | Medium   |
| **Explicit Types**       | Define interfaces for API responses, props, state     | High     |
| **Avoid `any`**          | Use `unknown` or proper types instead of `any`        | High     |
| **Utility Types**        | Use `Partial`, `Pick`, `Omit`, `Record` appropriately | Medium   |
| **Discriminated Unions** | Use for type-safe conditionals                        | Medium   |
| **Generic Constraints**  | Constrain generics to expected types                  | Medium   |
| **Path Aliases**         | Configure path aliases for clean imports              | Low      |

---

## 2. Security Best Practices

### OWASP Top 10 Alignment

| Risk                               | Best Practice                                      | Implementation                   |
| ---------------------------------- | -------------------------------------------------- | -------------------------------- |
| **A01: Broken Access Control**     | Implement RBAC, validate permissions server-side   | Middleware + Route Handlers      |
| **A02: Cryptographic Failures**    | Use strong encryption, secure key management       | Environment variables, Key Vault |
| **A03: Injection**                 | Use parameterized queries, validate/sanitize input | Zod + DOMPurify                  |
| **A04: Insecure Design**           | Threat modeling, secure defaults                   | Security headers, CSP            |
| **A05: Security Misconfiguration** | Minimal permissions, disable debug in prod         | Environment-based config         |
| **A06: Vulnerable Components**     | Regular dependency updates, audit                  | npm audit, Dependabot            |
| **A07: Auth Failures**             | MFA, secure session management, rate limiting      | JWT + rate limiting              |
| **A08: Software/Data Integrity**   | Verify dependencies, secure CI/CD                  | npm ci, signed commits           |
| **A09: Logging Failures**          | Log security events, protect logs                  | Audit logging                    |
| **A10: SSRF**                      | Validate URLs, allowlist domains                   | URL sanitization                 |

### Authentication & Authorization

| Best Practice                    | Standard                              |
| -------------------------------- | ------------------------------------- |
| JWT tokens with short expiration | 1 hour for access, 7 days for refresh |
| Secure token storage             | HttpOnly cookies in production        |
| Password hashing                 | bcrypt with cost factor 12+           |
| Session invalidation             | Token blacklist on logout             |
| Rate limiting on auth endpoints  | 5 attempts per 15 minutes             |
| RBAC implementation              | Check permissions per endpoint        |

### Input Validation & Sanitization

| Best Practice                  | Implementation                 |
| ------------------------------ | ------------------------------ |
| Validate all input server-side | Zod schemas                    |
| Sanitize HTML to prevent XSS   | DOMPurify                      |
| Validate file uploads          | Type, size, content checks     |
| Sanitize URLs for SSRF         | Protocol and domain allowlists |
| Escape output in templates     | React handles by default       |

### Security Headers

| Header                      | Value                                          | Purpose                |
| --------------------------- | ---------------------------------------------- | ---------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS            |
| `X-Frame-Options`           | `DENY` or `SAMEORIGIN`                         | Prevent clickjacking   |
| `X-Content-Type-Options`    | `nosniff`                                      | Prevent MIME sniffing  |
| `Content-Security-Policy`   | Restrictive policy                             | Prevent XSS, injection |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Control referrer info  |
| `Permissions-Policy`        | Restrict sensitive APIs                        | Limit feature access   |

---

## 3. Performance Optimization

### Bundle Size

| Best Practice                               | Target                 |
| ------------------------------------------- | ---------------------- |
| Tree shaking enabled                        | Automatic with Next.js |
| Dynamic imports for large modules           | Use `next/dynamic`     |
| Analyze bundle with `@next/bundle-analyzer` | Monitor regularly      |
| First Load JS                               | < 100KB per route      |
| Total bundle size                           | < 500KB gzipped        |

### Rendering Performance

| Best Practice                   | Implementation               |
| ------------------------------- | ---------------------------- |
| Server Components by default    | App Router                   |
| Minimize client-side JavaScript | Strategic Client Components  |
| Lazy load below-fold content    | Intersection Observer        |
| Optimize images                 | next/image with proper sizes |
| Implement pagination            | Limit data per page          |

### API Performance

| Best Practice    | Target                       |
| ---------------- | ---------------------------- |
| Response time    | < 200ms for simple queries   |
| Database queries | Use indexes, limit fields    |
| Caching strategy | SWR, React Query, or ISR     |
| Rate limiting    | Protect expensive operations |
| Batch operations | Reduce request count         |

### Core Web Vitals Targets

| Metric                         | Target  | Measurement     |
| ------------------------------ | ------- | --------------- |
| LCP (Largest Contentful Paint) | < 2.5s  | 75th percentile |
| FID (First Input Delay)        | < 100ms | 75th percentile |
| CLS (Cumulative Layout Shift)  | < 0.1   | 75th percentile |
| TTFB (Time to First Byte)      | < 800ms | 75th percentile |

---

## 4. Testing Strategies

### Coverage Standards

| Layer             | Minimum Coverage | Target Coverage          |
| ----------------- | ---------------- | ------------------------ |
| Unit Tests        | 70%              | 90%                      |
| Integration Tests | 50%              | 70%                      |
| E2E Tests         | Critical paths   | Happy paths + edge cases |
| Overall           | 70%              | 80%+                     |

### Test Types & Tools

| Type              | Tool                  | Focus                            |
| ----------------- | --------------------- | -------------------------------- |
| Unit              | Jest                  | Pure functions, utilities        |
| Component         | React Testing Library | User interactions, accessibility |
| API               | Supertest/fetch       | Route handlers, middleware       |
| Integration       | Jest + RTL            | Component + API interaction      |
| E2E               | Playwright/Cypress    | Critical user journeys           |
| Visual Regression | Chromatic/Percy       | UI consistency                   |

### Testing Best Practices

| Practice                          | Description                              |
| --------------------------------- | ---------------------------------------- |
| Test behavior, not implementation | Focus on user-facing outcomes            |
| Avoid testing framework internals | Don't test React/Next.js itself          |
| Mock external services            | Isolate tests from third parties         |
| Use realistic test data           | Factories/fixtures over hardcoded values |
| Test error states                 | Handle failures gracefully               |
| Test accessibility                | Use `jest-axe` for a11y checks           |
| Keep tests fast                   | < 10s for unit, < 60s for integration    |

### Test Organization

```
__tests__/
├── unit/           # Pure function tests
├── components/     # Component tests
├── api/            # API route tests
├── integration/    # Cross-boundary tests
├── e2e/            # End-to-end tests
└── fixtures/       # Shared test data
```

---

## 5. Documentation Conventions

### Code Documentation

| Type             | Standard                         | Tool          |
| ---------------- | -------------------------------- | ------------- |
| Function docs    | JSDoc/TSDoc comments             | TypeScript    |
| Complex logic    | Inline comments explaining "why" | -             |
| API endpoints    | OpenAPI/Swagger spec             | swagger-jsdoc |
| Type definitions | Self-documenting interfaces      | TypeScript    |

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

| Element                | Standard                |
| ---------------------- | ----------------------- |
| Endpoint description   | Clear purpose statement |
| Request/response types | TypeScript interfaces   |
| Error responses        | Documented error codes  |
| Examples               | cURL and code examples  |
| Authentication         | Required auth noted     |

---

## 6. Architectural Patterns

### Recommended Patterns for This Stack

| Pattern                     | Use Case               | Implementation               |
| --------------------------- | ---------------------- | ---------------------------- |
| **Feature-Based Structure** | Code organization      | Group by domain/feature      |
| **Repository Pattern**      | Data access            | Abstract data layer          |
| **Service Layer**           | Business logic         | Separate from API handlers   |
| **Middleware Chain**        | Cross-cutting concerns | Auth, logging, rate limiting |
| **Factory Pattern**         | Object creation        | Test fixtures, configs       |
| **Strategy Pattern**        | Algorithm variations   | Feature flag implementations |

### Layer Separation

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│    (Components, Pages, Hooks)           │
├─────────────────────────────────────────┤
│            Application Layer            │
│    (API Routes, Controllers)            │
├─────────────────────────────────────────┤
│             Domain Layer                │
│    (Business Logic, Services)           │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│    (Data Access, External APIs)         │
└─────────────────────────────────────────┘
```

### Recommended Practices

| Practice                     | Description                          |
| ---------------------------- | ------------------------------------ |
| Single Responsibility        | Each module has one reason to change |
| Dependency Injection         | Pass dependencies, don't hardcode    |
| Interface Segregation        | Small, focused interfaces            |
| Open/Closed                  | Extend behavior without modification |
| Composition over Inheritance | Prefer composition                   |

---

## 7. Accessibility Standards

### WCAG 2.1 AA Compliance

| Category           | Requirements                                        |
| ------------------ | --------------------------------------------------- |
| **Perceivable**    | Text alternatives, captions, color contrast (4.5:1) |
| **Operable**       | Keyboard accessible, no seizure triggers, navigable |
| **Understandable** | Readable, predictable, input assistance             |
| **Robust**         | Compatible with assistive technologies              |

### React Accessibility

| Best Practice    | Implementation                           |
| ---------------- | ---------------------------------------- |
| Semantic HTML    | Use correct elements (button, nav, main) |
| ARIA labels      | When semantic HTML insufficient          |
| Focus management | Logical tab order, focus indicators      |
| Skip links       | Allow skipping navigation                |
| Form labels      | Associate labels with inputs             |
| Error messages   | Clear, accessible error feedback         |
| Color contrast   | 4.5:1 for normal text, 3:1 for large     |

### Testing Accessibility

| Tool                   | Purpose                          |
| ---------------------- | -------------------------------- |
| jest-axe               | Automated a11y testing in Jest   |
| eslint-plugin-jsx-a11y | Lint for a11y issues             |
| Lighthouse             | Audit a11y score                 |
| Screen readers         | Manual testing (NVDA, VoiceOver) |

---

## 8. DevOps & Deployment

### CI/CD Pipeline Standards

| Stage      | Checks                    | Failure Action                  |
| ---------- | ------------------------- | ------------------------------- |
| Install    | `npm ci`                  | Block deployment                |
| Lint       | ESLint, Prettier          | Block on errors                 |
| Type Check | `tsc --noEmit`            | Block deployment                |
| Test       | Jest (unit + integration) | Block if < threshold            |
| Build      | `next build`              | Block deployment                |
| Security   | `npm audit`               | Warn on moderate, block on high |
| Deploy     | Environment-specific      | Blue-green or rolling           |

### Azure Web Apps Best Practices

| Practice               | Implementation            |
| ---------------------- | ------------------------- |
| Infrastructure as Code | Bicep templates           |
| Environment separation | dev/test/prod resources   |
| Secrets management     | Azure Key Vault           |
| Application Insights   | Performance monitoring    |
| Auto-scaling           | CPU/memory-based rules    |
| Health checks          | `/api/health` endpoint    |
| Deployment slots       | Staging before production |

### Environment Management

| Environment | Purpose           | Characteristics                  |
| ----------- | ----------------- | -------------------------------- |
| Development | Local development | Debug enabled, hot reload        |
| Test        | Automated testing | Test data, mocked services       |
| Staging     | Pre-production    | Production-like, internal access |
| Production  | Live users        | Hardened, monitored, scaled      |

---

## 9. Code Organization

### Directory Structure Standards

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/           # Route groups
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   └── [feature]/          # Feature-specific components
├── lib/
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── clients/            # External API clients
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
├── config/                 # Configuration files
└── styles/                 # Global styles
```

### File Naming Conventions

| Type       | Convention                  | Example            |
| ---------- | --------------------------- | ------------------ |
| Components | PascalCase                  | `UserProfile.tsx`  |
| Hooks      | camelCase with `use` prefix | `useAuth.ts`       |
| Utilities  | camelCase                   | `formatDate.ts`    |
| Types      | PascalCase                  | `User.ts`          |
| Constants  | SCREAMING_SNAKE_CASE        | `API_ENDPOINTS.ts` |
| Test files | `*.test.ts` or `*.spec.ts`  | `auth.test.ts`     |

### Import Order

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { NextResponse } from 'next/server';

// 2. Third-party imports
import { z } from 'zod';
import axios from 'axios';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 4. Relative imports
import { validateInput } from './utils';

// 5. Type imports
import type { User } from '@/types';
```

---

## 10. Dependency Management

### Version Control

| Practice           | Standard                          |
| ------------------ | --------------------------------- |
| Pin major versions | `"react": "^18.0.0"`              |
| Lock file          | Always commit `package-lock.json` |
| Regular updates    | Monthly dependency review         |
| Security patches   | Within 24-48 hours                |
| Breaking changes   | Planned migration sprints         |

### Dependency Hygiene

| Practice           | Frequency       |
| ------------------ | --------------- |
| `npm audit`        | Every CI run    |
| `npm outdated`     | Weekly          |
| Remove unused deps | Monthly         |
| Review new deps    | Before adding   |
| License compliance | Quarterly audit |

### Criteria for New Dependencies

| Factor       | Consideration                        |
| ------------ | ------------------------------------ |
| Maintenance  | Active maintainers, recent commits   |
| Security     | No known vulnerabilities             |
| Size         | Bundle impact acceptable             |
| License      | Compatible (MIT, Apache 2.0, BSD)    |
| Alternatives | Is it necessary vs. native solution? |

---

## 11. Error Handling & Logging

### Error Handling Standards

| Layer             | Strategy                                    |
| ----------------- | ------------------------------------------- |
| API Routes        | Try-catch with standardized error responses |
| Components        | Error boundaries for graceful degradation   |
| Async Operations  | Proper promise rejection handling           |
| External Services | Retry with exponential backoff              |
| Validation        | Return actionable error messages            |

### Error Response Format

```typescript
interface ErrorResponse {
  message: string; // Human-readable message
  code: string; // Machine-readable code (e.g., "AUTH_REQUIRED")
  details?: unknown; // Additional context (validation errors)
  requestId?: string; // For tracing
  timestamp: string; // ISO 8601 timestamp
}
```

### Logging Standards

| Level | Use Case            | Example                       |
| ----- | ------------------- | ----------------------------- |
| ERROR | Unexpected failures | Unhandled exceptions          |
| WARN  | Recoverable issues  | Rate limit approaching        |
| INFO  | Business events     | User login, content published |
| DEBUG | Development info    | Request/response details      |

### Audit Logging

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

## 12. State Management

### State Categories

| Type         | Scope       | Tool                        |
| ------------ | ----------- | --------------------------- |
| UI State     | Component   | useState                    |
| Form State   | Form        | useState or react-hook-form |
| Server State | Application | SWR, React Query, or fetch  |
| Global State | Application | Context API or Zustand      |
| URL State    | Navigation  | Next.js router              |

### Best Practices

| Practice               | Description                                 |
| ---------------------- | ------------------------------------------- |
| Colocate state         | Keep state close to where it's used         |
| Minimize global state  | Only share what's necessary                 |
| Derive state           | Calculate from existing state when possible |
| Single source of truth | Avoid duplicating state                     |
| Immutable updates      | Never mutate state directly                 |

### Server State Management

| Practice               | Standard                        |
| ---------------------- | ------------------------------- |
| Cache invalidation     | Automatic revalidation          |
| Optimistic updates     | Immediate UI feedback           |
| Error recovery         | Retry with backoff              |
| Loading states         | Skeleton or spinner             |
| Stale-while-revalidate | Show cached data while fetching |

### Form State

| Practice            | Standard                  |
| ------------------- | ------------------------- |
| Controlled inputs   | For complex validation    |
| Uncontrolled inputs | For simple forms          |
| Validation          | Zod schemas               |
| Error display       | Per-field messages        |
| Submit handling     | Disable during submission |

---

## Summary: Evaluation Criteria

The following checklist summarizes the key criteria that will be used to evaluate the OmniPost in subsequent analysis phases:

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

_This benchmark document serves as the reference standard for evaluating the OmniPost against industry best practices._
