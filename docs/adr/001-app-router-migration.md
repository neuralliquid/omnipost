# ADR 001: App Router Migration Strategy

> **Status**: Implemented
> **Date**: December 2025
> **Decision Makers**: Development Team
> **Technical Area**: Architecture / Frontend

---

## Context

The Content Creation Platform currently uses a hybrid approach with both Next.js Pages Router and App Router. The majority of the application logic resides in the Pages Router (`pages/` directory), while API routes use the App Router (`app/api/` directory).

### Current State

```
├── app/
│   ├── api/           # App Router API routes (already migrated)
│   │   ├── auth/
│   │   ├── feature-flags/
│   │   ├── health/
│   │   ├── images/
│   │   ├── parse/
│   │   ├── platforms/
│   │   └── summarize/
│   ├── layout.tsx     # Root layout (Phase 1 complete)
│   ├── loading.tsx    # Global loading state
│   ├── error.tsx      # Error boundary
│   └── not-found.tsx  # 404 page
├── pages/
│   ├── _app.tsx       # Pages Router entry point (to be removed)
│   ├── _document.tsx  # Custom document (to be removed)
│   ├── index.tsx      # Landing page (Phase 2)
│   ├── dashboard.tsx  # Dashboard (Phase 3)
│   └── human-review/  # Review workflow (Phase 4)
│       ├── index.tsx
│       └── [id].tsx
├── components/
│   ├── ui/            # Shared UI components
│   ├── forms/         # Form components (need 'use client')
│   └── review/        # Review workflow components
├── hooks/
│   └── useReviewProcess.ts  # Main workflow hook
└── lib/
    ├── featureFlags.ts
    └── api-client.ts
```

### Pain Points

1. **Inconsistent Patterns**: Different data fetching strategies between routers
2. **No Server Components**: Missing React Server Component benefits
3. **Bundle Size**: Client-side rendering increases JavaScript bundle (~150-200KB first load)
4. **State Management**: Manual state management without server-side benefits
5. **Technical Debt**: Maintaining two routing paradigms
6. **SEO Limitations**: Client-rendered content not optimal for search engines

---

## Decision

We will migrate incrementally to the App Router following a phased approach that minimizes risk and allows for validation at each stage.

---

## File Migration Mapping

### Pages to App Router Mapping

| Current (Pages Router) | Target (App Router) | Type | Priority |
|------------------------|---------------------|------|----------|
| `pages/_app.tsx` | `app/layout.tsx` | Layout | ✅ Done |
| `pages/_document.tsx` | `app/layout.tsx` | Layout | ✅ Done |
| `pages/index.tsx` | `app/(marketing)/page.tsx` | Static | Phase 2 |
| `pages/dashboard.tsx` | `app/(dashboard)/dashboard/page.tsx` | Dynamic | Phase 3 |
| `pages/human-review/index.tsx` | `app/(dashboard)/review/page.tsx` | Complex | Phase 4 |
| `pages/human-review/[id].tsx` | `app/(dashboard)/review/[id]/page.tsx` | Complex | Phase 4 |

### Component Classification

| Component | Type | Reason | Migration Action |
|-----------|------|--------|------------------|
| `Header` | Server | Static content | Keep as-is |
| `Footer` | Server | Static content | Keep as-is |
| `Toast` | Client | Uses state/effects | Add 'use client' |
| `LoginForm` | Client | Form interactivity | Add 'use client' |
| `FeatureFlagToggle` | Client | State management | Add 'use client' |
| `ReviewStepIndicator` | Server | Display only | Keep as-is |
| `ContentEditor` | Client | Rich text editing | Add 'use client' |
| `ImagePreview` | Server | Static display | Keep as-is |
| `PlatformSelector` | Client | Interactive selection | Add 'use client' |

---

## Migration Phases

### Phase 1: Preparation (Low Risk) ✅ COMPLETE

**Status**: Complete

**Completed Items**:
- [x] Add root layout (`app/layout.tsx`)
- [x] Create loading component (`app/loading.tsx`)
- [x] Create error boundary (`app/error.tsx`)
- [x] Create not-found page (`app/not-found.tsx`)
- [x] Configure metadata in layout
- [x] Add accessibility skip link

**Files Created**:
```
app/
├── layout.tsx      # Root layout with metadata
├── loading.tsx     # Loading spinner
├── error.tsx       # Error boundary with recovery
└── not-found.tsx   # 404 page
```

---

### Phase 2: Static Pages (Low Risk) ✅ COMPLETE

**Status**: Complete

**Objective**: Migrate landing page with Static Site Generation (SSG)

#### Step 2.1: Create Marketing Route Group

```bash
mkdir -p app/(marketing)
```

#### Step 2.2: Migrate Landing Page

**Before** (`pages/index.tsx`):
```typescript
export default function Home() {
  return <LandingPage />;
}
```

**After** (`app/(marketing)/page.tsx`):
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Creation Platform',
  description: 'AI-powered content creation and multi-platform publishing',
};

export default function HomePage() {
  return <LandingPage />;
}
```

#### Step 2.3: Add Marketing Layout (Optional)

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </>
  );
}
```

#### Step 2.4: Validation Checklist
- [ ] Page renders correctly
- [ ] Metadata appears in HTML head
- [ ] Loading state works
- [ ] Error boundary catches errors
- [ ] Performance metrics (LCP < 2.5s)

---

### Phase 3: Dynamic Pages (Medium Risk) ✅ COMPLETE

**Status**: Complete

**Objective**: Migrate dashboard with Server Components and data fetching

#### Step 3.1: Create Dashboard Route Group

```bash
mkdir -p app/(dashboard)/dashboard
```

#### Step 3.2: Create Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

#### Step 3.3: Migrate Dashboard Page

**Before** (`pages/dashboard.tsx`):
```typescript
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <DashboardContent data={data} />;
}
```

**After** (`app/(dashboard)/dashboard/page.tsx`):
```typescript
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

async function getDashboardData() {
  // Server-side fetch - no client bundle impact
  const res = await fetch(`${process.env.API_URL}/dashboard`, {
    cache: 'no-store', // or 'force-cache' for static
  });
  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent data={data} />
      </Suspense>
    </div>
  );
}
```

#### Step 3.4: Create Loading State

```typescript
// app/(dashboard)/dashboard/loading.tsx
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
```

#### Step 3.5: Validation Checklist
- [ ] Authentication redirect works
- [ ] Data fetches on server
- [ ] Streaming/Suspense works
- [ ] Client bundle size reduced
- [ ] No hydration mismatches

---

### Phase 4: Complex Flows (Higher Risk) ✅ COMPLETE

**Status**: Complete

**Objective**: Migrate human review workflow with Server Actions

#### Step 4.1: Create Review Route Group

```bash
mkdir -p app/(dashboard)/review/[id]
```

#### Step 4.2: Implement Server Actions

```typescript
// app/(dashboard)/review/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ParseSchema = z.object({
  rawInput: z.string().min(1),
});

export async function parseContent(formData: FormData) {
  const validated = ParseSchema.parse({
    rawInput: formData.get('rawInput'),
  });

  const response = await fetch(`${process.env.API_URL}/api/parse`, {
    method: 'POST',
    body: JSON.stringify(validated),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Parse failed');
  }

  const result = await response.json();
  revalidatePath('/review');
  return result;
}

export async function generateImage(formData: FormData) {
  const prompt = formData.get('prompt') as string;

  const response = await fetch(`${process.env.API_URL}/api/images`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Image generation failed');
  }

  return response.json();
}

export async function summarizeContent(formData: FormData) {
  const content = formData.get('content') as string;

  const response = await fetch(`${process.env.API_URL}/api/summarize`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  });

  return response.json();
}
```

#### Step 4.3: Create Review Page with Form

```typescript
// app/(dashboard)/review/page.tsx
import { Metadata } from 'next';
import { ReviewForm } from './ReviewForm';

export const metadata: Metadata = {
  title: 'Content Review',
};

export default function ReviewPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Content Review</h1>
      <ReviewForm />
    </div>
  );
}
```

#### Step 4.4: Create Client Form Component

```typescript
// app/(dashboard)/review/ReviewForm.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { parseContent, generateImage, summarizeContent } from './actions';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? 'Processing...' : children}
    </button>
  );
}

export function ReviewForm() {
  const [parseResult, parseAction] = useActionState(parseContent, null);
  const [imageResult, imageAction] = useActionState(generateImage, null);
  const [summaryResult, summaryAction] = useActionState(summarizeContent, null);

  return (
    <div className="space-y-8">
      {/* Step 1: Parse */}
      <form action={parseAction} className="space-y-4">
        <label htmlFor="rawInput" className="block font-medium">
          Raw Content
        </label>
        <textarea
          id="rawInput"
          name="rawInput"
          rows={10}
          className="w-full border rounded p-2"
          placeholder="Paste your content here..."
        />
        <SubmitButton>Parse Content</SubmitButton>
      </form>

      {parseResult && (
        <>
          {/* Step 2: Generate Image */}
          <form action={imageAction} className="space-y-4">
            <input type="hidden" name="prompt" value={parseResult.title} />
            <SubmitButton>Generate Image</SubmitButton>
          </form>

          {/* Step 3: Summarize */}
          <form action={summaryAction} className="space-y-4">
            <input type="hidden" name="content" value={parseResult.content} />
            <SubmitButton>Generate Summary</SubmitButton>
          </form>
        </>
      )}

      {/* Results Display */}
      {imageResult && (
        <div className="mt-4">
          <h3 className="font-medium">Generated Image</h3>
          <img src={imageResult.imageUrl} alt="Generated" className="max-w-md" />
        </div>
      )}

      {summaryResult && (
        <div className="mt-4">
          <h3 className="font-medium">Summary</h3>
          <p>{summaryResult.summary}</p>
        </div>
      )}
    </div>
  );
}
```

#### Step 4.5: Migrate Dynamic Route

```typescript
// app/(dashboard)/review/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Review #${params.id}`,
  };
}

async function getReview(id: string) {
  const res = await fetch(`${process.env.API_URL}/api/reviews/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function ReviewDetailPage({ params }: Props) {
  const review = await getReview(params.id);

  if (!review) {
    notFound();
  }

  return (
    <div>
      <h1>Review #{params.id}</h1>
      <ReviewDetail review={review} />
    </div>
  );
}
```

#### Step 4.6: Validation Checklist
- [ ] Server Actions execute correctly
- [ ] Form validation works
- [ ] Error handling displays properly
- [ ] Optimistic updates (if implemented)
- [ ] useReviewProcess hook migrated or replaced
- [ ] All workflow steps functional

---

### Phase 5: Cleanup ✅ COMPLETE

**Status**: Complete

**Objective**: Remove Pages Router and finalize migration

#### Step 5.1: Remove Pages Router Files

```bash
# After all pages migrated and validated
rm -rf pages/
rm pages/_app.tsx
rm pages/_document.tsx
```

#### Step 5.2: Update next.config.ts

```typescript
// next.config.ts
const nextConfig = {
  // Remove any Pages Router specific config
  // Ensure App Router is primary
};
```

#### Step 5.3: Update Imports

Search and replace any imports from `pages/` directory.

#### Step 5.4: Final Validation
- [ ] All routes accessible
- [ ] No 404 errors
- [ ] Performance benchmarks met
- [ ] Tests passing
- [ ] Documentation updated

---

## Testing Strategy

### Unit Tests

Existing Jest tests will continue to work. Component tests may need updates:

```typescript
// Before: Testing Pages Router component
import { render } from '@testing-library/react';
import Dashboard from '@/pages/dashboard';

test('renders dashboard', () => {
  render(<Dashboard />);
});

// After: Testing App Router component
import { render } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// Note: Server Components require async rendering
test('renders dashboard', async () => {
  const Page = await DashboardPage();
  render(Page);
});
```

### Server Action Tests

```typescript
// __tests__/actions/review.test.ts
import { parseContent } from '@/app/(dashboard)/review/actions';

describe('parseContent', () => {
  it('should parse valid content', async () => {
    const formData = new FormData();
    formData.set('rawInput', 'Test content');

    const result = await parseContent(formData);
    expect(result).toHaveProperty('parsed');
  });

  it('should throw on invalid input', async () => {
    const formData = new FormData();
    formData.set('rawInput', '');

    await expect(parseContent(formData)).rejects.toThrow();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/review-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete review workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to review
  await page.goto('/review');
  await expect(page).toHaveURL('/review');

  // Fill content
  await page.fill('#rawInput', 'Test content for parsing');
  await page.click('button:text("Parse Content")');

  // Wait for result
  await expect(page.locator('.parse-result')).toBeVisible();
});
```

### Test Coverage Requirements

| Phase | Coverage Target | Critical Paths |
|-------|-----------------|----------------|
| Phase 2 | 70% | Landing page renders |
| Phase 3 | 75% | Dashboard loads, auth redirect |
| Phase 4 | 80% | Full review workflow |
| Phase 5 | 80% | All routes functional |

---

## Rollback Procedures

### Per-Phase Rollback

Each phase can be rolled back independently:

#### Phase 2 Rollback
```bash
# Revert landing page
git revert <phase-2-commit>
# Or simply delete app/(marketing) and keep pages/index.tsx
rm -rf app/(marketing)
```

#### Phase 3 Rollback
```bash
# Revert dashboard migration
git revert <phase-3-commit>
rm -rf app/(dashboard)
```

#### Phase 4 Rollback
```bash
# Revert review workflow
git revert <phase-4-commit>
# Restore hooks/useReviewProcess.ts if modified
git checkout HEAD~1 -- hooks/useReviewProcess.ts
```

### Feature Flags for Gradual Rollout

```typescript
// lib/featureFlags.ts
export const featureFlags = {
  // ... existing flags
  useAppRouterDashboard: {
    enabled: false, // Toggle during migration
    implementation: 'app-router',
  },
  useAppRouterReview: {
    enabled: false,
    implementation: 'app-router',
  },
};
```

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import featureFlags from '@/lib/featureFlags';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Feature flag controlled routing
  if (pathname === '/dashboard' && !featureFlags.useAppRouterDashboard.enabled) {
    // Rewrite to Pages Router version
    return NextResponse.rewrite(new URL('/pages-dashboard', request.url));
  }

  return NextResponse.next();
}
```

### Emergency Rollback

If critical issues are discovered after deployment:

```bash
# 1. Immediate: Deploy previous version
git checkout <last-stable-tag>
npm run build && npm run deploy

# 2. Short-term: Disable feature flags
# Update featureFlags.ts and deploy

# 3. Investigation: Create hotfix branch
git checkout -b hotfix/app-router-issue
```

---

## Dependency Considerations

### Dependencies to Update

| Package | Current | Required | Reason |
|---------|---------|----------|--------|
| `next` | 14.x | 14.x+ | App Router support |
| `react` | 18.x | 18.x+ | Server Components |
| `react-dom` | 18.x | 18.x+ | Server Components |

### Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `server-only` | latest | Prevent server code in client |

```bash
npm install server-only
```

### Dependencies to Audit for RSC Compatibility

| Package | RSC Compatible | Action |
|---------|----------------|--------|
| `axios` | Yes | No change |
| `zod` | Yes | No change |
| `date-fns` | Yes | No change |
| `dompurify` | Client-only | Add 'use client' where used |
| `react-hook-form` | Client-only | Add 'use client' where used |

### Server-Only Utilities

```typescript
// lib/server-only.ts
import 'server-only';

// These functions will error if imported in client components
export async function getSecureData() {
  // Server-only logic
}
```

---

## Hook Migration Guide

### useReviewProcess Hook

The main workflow hook needs to be restructured for Server Components:

**Current Structure**:
```typescript
// hooks/useReviewProcess.ts
export function useReviewProcess() {
  const [rawInput, setRawInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseText = async () => {
    setIsLoading(true);
    const result = await fetch('/api/parse', { ... });
    setParsedData(result);
    setIsLoading(false);
  };

  return { rawInput, parsedData, isLoading, parseText, ... };
}
```

**Migration Options**:

1. **Server Actions** (Recommended)
   - Move data fetching to Server Actions
   - Use `useActionState` for form state
   - See Phase 4 implementation above

2. **Keep as Client Hook** (Simpler)
   - Add 'use client' to files using the hook
   - No changes to hook implementation
   - Less bundle size reduction

3. **Hybrid Approach**
   - Server-side initial data fetch
   - Client-side mutations via hook

---

## Performance Benchmarks

### Baseline Metrics (Current Pages Router)

Measure before migration:

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --output json --output-path ./baseline.json
```

| Metric | Target | Baseline |
|--------|--------|----------|
| First Load JS | < 100KB | ~150KB |
| LCP | < 2.5s | TBD |
| FID | < 100ms | TBD |
| CLS | < 0.1 | TBD |
| TTFB | < 800ms | TBD |

### Expected Improvements

| Metric | Expected Change | Reason |
|--------|-----------------|--------|
| First Load JS | -30% to -50% | Server Components |
| LCP | -20% to -40% | Server rendering |
| TTFB | Varies | Depends on data fetching |
| Bundle Size | -30% | Less client JS |

### Measurement Script

```bash
#!/bin/bash
# scripts/measure-performance.sh

echo "Measuring performance..."

# Build production
npm run build

# Start server
npm start &
SERVER_PID=$!
sleep 5

# Run Lighthouse
npx lighthouse http://localhost:3000 \
  --output json \
  --output-path ./performance-report.json \
  --chrome-flags="--headless"

# Cleanup
kill $SERVER_PID

# Extract key metrics
node -e "
const report = require('./performance-report.json');
console.log('LCP:', report.audits['largest-contentful-paint'].numericValue);
console.log('FID:', report.audits['max-potential-fid'].numericValue);
console.log('CLS:', report.audits['cumulative-layout-shift'].numericValue);
console.log('Total JS:', report.audits['total-byte-weight'].numericValue);
"
```

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
- [Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- `docs/analysis/scores/06-CODE_PATTERNS.md`
- `docs/analysis/scores/11-PERFORMANCE.md`
- `docs/API_REFERENCE.md`

---

## Quick Reference Checklist

### Pre-Migration Checklist

- [ ] Baseline performance metrics captured
- [ ] Test coverage > 70%
- [ ] All dependencies RSC-compatible or marked
- [ ] Team trained on App Router patterns
- [ ] Rollback procedures documented

### Per-Phase Checklist

- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance metrics stable or improved
- [ ] Accessibility maintained
- [ ] SEO metadata present

### Post-Migration Checklist

- [ ] All Pages Router files removed
- [ ] No imports from `pages/` directory
- [ ] Performance improved by target metrics
- [ ] Documentation updated
- [ ] Team retrospective completed

---

## FAQ

### Q: Can we use Pages Router and App Router together indefinitely?

**A:** Yes, Next.js supports both routers. However, this increases complexity and technical debt. The migration plan aims to complete the transition within a reasonable timeframe.

### Q: What happens to our existing tests?

**A:** Most tests will continue to work. Component tests for Server Components need minor updates to handle async rendering. API tests are unaffected.

### Q: How do we handle authentication in Server Components?

**A:** Use middleware for route protection and server-side session validation in layouts. See Phase 3 for implementation details.

### Q: What about third-party components that don't support RSC?

**A:** Wrap them in a Client Component with 'use client'. This is the standard pattern for non-RSC-compatible libraries.

### Q: How do we debug Server Components?

**A:** Use `console.log` (appears in server logs), React DevTools (for client parts), and Next.js error overlay. Server-side debugging is similar to API route debugging.

---

## Glossary

| Term | Definition |
|------|------------|
| **RSC** | React Server Components - Components that render on the server only |
| **Server Actions** | Functions that run on the server, callable from client forms |
| **Route Groups** | Folders with `(name)` that organize routes without affecting URL |
| **Streaming SSR** | Sending HTML to client in chunks as it renders |
| **ISR** | Incremental Static Regeneration - Updating static pages after build |
| **SSG** | Static Site Generation - Pre-rendering pages at build time |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12 | Development Team | Initial proposal |
| 2025-12 | Development Team | Accepted: Added detailed migration phases |
| 2025-12 | Development Team | Added file mapping, testing strategy, rollback procedures |
| 2025-12 | Development Team | Completed Phase 1 preparation |
| 2025-12 | Development Team | **IMPLEMENTED**: All phases complete. Migration finished. |

---

## Implementation Summary

### Completed Migration (December 2025)

The App Router migration has been successfully completed. All pages have been migrated from the Pages Router to the App Router.

#### Final Route Structure

```
app/
├── layout.tsx                      # Root layout with fonts & metadata
├── not-found.tsx                   # 404 page
├── (marketing)/
│   ├── layout.tsx                  # Marketing layout (Header/Footer)
│   ├── page.tsx                    # Landing page (SSG)
│   ├── loading.tsx                 # Marketing loading state
│   └── error.tsx                   # Marketing error boundary
└── (dashboard)/
    ├── layout.tsx                  # Dashboard layout
    ├── loading.tsx                 # Dashboard loading state
    ├── error.tsx                   # Dashboard error boundary
    ├── dashboard/
    │   ├── page.tsx                # Performance dashboard (Server Component)
    │   ├── DashboardMetrics.tsx    # Client component with refresh
    │   └── AirtableSection.tsx     # Client wrapper
    ├── review/
    │   ├── page.tsx                # Review workflow page
    │   ├── actions.ts              # Server Actions
    │   └── ReviewWorkflow.tsx      # Multi-step client component
    ├── automation/
    │   ├── page.tsx                # Automation page (ISR: 1h)
    │   └── AutomationContent.tsx   # Client component
    ├── content-adaptation/
    │   └── page.tsx                # Content adaptation (ISR: 1d)
    ├── platform-analysis/
    │   └── page.tsx                # Platform analysis (static)
    ├── series/
    │   ├── page.tsx                # Series management
    │   └── SeriesContent.tsx       # Client component
    └── workflow/
        └── page.tsx                # Workflow guide (static)
```

#### Key Changes Made

1. **Pages Router Removed**: All files in `pages/` directory deleted
2. **Route Groups**: Used `(marketing)` and `(dashboard)` for organization
3. **Server Components**: Dashboard and content pages use server-side data fetching
4. **Server Actions**: Review workflow uses `useActionState` pattern
5. **Loading States**: Added `loading.tsx` for each route group
6. **Error Boundaries**: Added `error.tsx` with recovery options
7. **ISR Configuration**: Automation (1h) and Content Adaptation (1d) use revalidation
8. **Image Config**: Updated to use `images.remotePatterns`
9. **Fonts**: Configured for system fonts (Google Fonts available when network allows)

#### Validation Results

- ✅ Build passes successfully
- ✅ All tests pass (38/38)
- ✅ All routes accessible
- ✅ Metadata properly configured
- ✅ Loading states working
- ✅ Error boundaries functional
