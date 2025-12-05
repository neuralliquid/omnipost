# ADR 001: App Router Migration Strategy

> **Status**: Proposed
> **Date**: December 2025
> **Decision Makers**: Development Team
> **Technical Area**: Architecture / Frontend

---

## Context

The Content Creation Platform currently uses a hybrid approach with both Next.js Pages Router and App Router. The majority of the application logic resides in the Pages Router (`pages/` directory), while API routes use the App Router (`app/api/` directory).

### Current State

```
├── app/
│   └── api/           # App Router API routes
│       ├── auth/
│       ├── feature-flags/
│       ├── health/
│       ├── images/
│       ├── parse/
│       ├── platforms/
│       └── summarize/
├── pages/
│   ├── _app.tsx       # Pages Router entry point
│   ├── index.tsx      # Landing page
│   ├── dashboard.tsx
│   └── human-review/
```

### Pain Points

1. **Inconsistent Patterns**: Different data fetching strategies between routers
2. **No Server Components**: Missing React Server Component benefits
3. **Bundle Size**: Client-side rendering increases JavaScript bundle
4. **State Management**: Manual state management without server-side benefits
5. **Technical Debt**: Maintaining two routing paradigms

---

## Decision

We will migrate incrementally to the App Router following a phased approach that minimizes risk and allows for validation at each stage.

### Migration Phases

#### Phase 1: Preparation (Low Risk)
- Add shared layouts in `app/` directory
- Create loading and error boundary components
- Set up streaming SSR infrastructure
- Document component migration patterns

#### Phase 2: Static Pages (Low Risk)
- Migrate landing page to App Router with SSG
- Migrate documentation/static content pages
- Implement proper metadata exports

#### Phase 3: Dynamic Pages (Medium Risk)
- Migrate dashboard with server components
- Convert data fetching to server-side
- Implement streaming for slow data

#### Phase 4: Complex Flows (Higher Risk)
- Migrate human review workflow
- Convert forms to server actions
- Implement optimistic updates

#### Phase 5: Cleanup
- Remove Pages Router code
- Update documentation
- Performance validation

---

## Options Considered

### Option 1: Big Bang Migration ❌

Migrate everything at once.

**Pros:**
- Single migration effort
- Consistent codebase after completion

**Cons:**
- High risk of regressions
- Long development cycle
- Difficult rollback
- Testing complexity

### Option 2: Incremental Migration ✅ (Selected)

Migrate page-by-page, feature-by-feature.

**Pros:**
- Lower risk per change
- Continuous delivery
- Easy rollback
- Validates patterns incrementally

**Cons:**
- Longer total timeline
- Temporary inconsistency
- Need to maintain both patterns temporarily

### Option 3: Stay on Pages Router ❌

Keep current architecture.

**Pros:**
- No migration effort
- Known patterns

**Cons:**
- Missing Server Component benefits
- Increasing technical debt
- Future migration will be harder

---

## Implementation Guidelines

### Server Components

```typescript
// app/dashboard/page.tsx (Server Component)
async function DashboardPage() {
  const data = await fetchDashboardData(); // Server-side fetch

  return (
    <div>
      <DashboardHeader />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent data={data} />
      </Suspense>
    </div>
  );
}
```

### Client Components

```typescript
// app/dashboard/components/InteractiveChart.tsx
'use client';

import { useState } from 'react';

export function InteractiveChart({ initialData }) {
  const [filter, setFilter] = useState('all');
  // Client-side interactivity
}
```

### Data Fetching

```typescript
// Before (Pages Router)
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// After (App Router)
async function Page() {
  const data = await fetchData(); // Direct fetch in component
  return <Component data={data} />;
}
```

### Layouts

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

---

## Consequences

### Positive

- **Performance**: Reduced client-side JavaScript
- **SEO**: Better server-rendered content
- **DX**: Simpler data fetching patterns
- **Future-proof**: Aligned with React/Next.js direction

### Negative

- **Migration Effort**: Development time required
- **Learning Curve**: Team needs to learn new patterns
- **Temporary Complexity**: Two patterns during migration

### Risks

| Risk | Mitigation |
|------|------------|
| Regressions | Comprehensive test coverage before migration |
| Performance issues | Benchmark each page before/after |
| Team velocity | Training and documentation |
| Third-party compatibility | Audit dependencies for RSC support |

---

## Success Metrics

1. **Bundle Size**: Reduce First Load JS by 30%+
2. **LCP**: Improve Largest Contentful Paint by 20%+
3. **Test Coverage**: Maintain 70%+ coverage during migration
4. **Build Time**: No increase in build times

---

## Related Documents

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- `docs/analysis/scores/06-CODE_PATTERNS.md`

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12 | Development Team | Initial proposal |
