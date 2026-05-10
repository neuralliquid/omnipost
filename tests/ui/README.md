# UI Snapshot Test Plan — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Overview

This document defines the UX/UI testing strategy including critical user flows, Playwright snapshot test skeletons, and companion automated tests for comprehensive end-to-end coverage.

---

## Critical User Flows

### Flow 1: Authentication

**Priority:** Critical
**Path:** Login Page → Dashboard

| Step | Action                  | Expected Result         |
| ---- | ----------------------- | ----------------------- |
| 1    | Navigate to /login      | Login form displayed    |
| 2    | Enter valid credentials | Form accepts input      |
| 3    | Submit form             | Loading state shown     |
| 4    | Successful auth         | Redirect to /dashboard  |
| 5    | Invalid credentials     | Error message displayed |

---

### Flow 2: Content Creation

**Priority:** Critical
**Path:** Dashboard → Content Editor → Save

| Step | Action                 | Expected Result                |
| ---- | ---------------------- | ------------------------------ |
| 1    | Click "Create Content" | Editor opens                   |
| 2    | Enter content text     | Text area populated            |
| 3    | Select platforms       | Platforms highlighted          |
| 4    | Click "Save Draft"     | Content saved, success message |
| 5    | Validation error       | Error displayed inline         |

---

### Flow 3: Content Publishing

**Priority:** Critical
**Path:** Content List → Schedule → Publish

| Step | Action              | Expected Result                 |
| ---- | ------------------- | ------------------------------- |
| 1    | Select content item | Item highlighted                |
| 2    | Click "Schedule"    | Schedule modal opens            |
| 3    | Select date/time    | Date picker updates             |
| 4    | Confirm schedule    | Content scheduled, modal closes |
| 5    | Publish now         | Content published immediately   |

---

### Flow 4: Campaign Management

**Priority:** High
**Path:** Campaigns → Create → Configure → Save

| Step | Action                 | Expected Result                    |
| ---- | ---------------------- | ---------------------------------- |
| 1    | Navigate to /campaigns | Campaign list displayed            |
| 2    | Click "New Campaign"   | Campaign form opens                |
| 3    | Fill campaign details  | Form populated                     |
| 4    | Add platforms          | Platforms selected                 |
| 5    | Save campaign          | Campaign created, redirect to list |

---

### Flow 5: Dashboard Overview

**Priority:** Medium
**Path:** Login → Dashboard → View Stats

| Step | Action                 | Expected Result        |
| ---- | ---------------------- | ---------------------- |
| 1    | Navigate to /dashboard | Dashboard loads        |
| 2    | View content stats     | Stats cards populated  |
| 3    | View recent content    | Content list displayed |
| 4    | Navigate to content    | Content detail opens   |

---

## Playwright Test Skeletons

### Test Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Flow 1: Authentication Tests

```typescript
// tests/ui/auth.spec.ts
import { test, expect } from '@playwright/test';

// Deterministic viewport
test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed/mock strategy: clear auth state
    await page.context().clearCookies();
  });

  test('displays login form', async ({ page }) => {
    await page.goto('/login');

    // Stable selectors
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Snapshot test
    await expect(page).toHaveScreenshot('login-form.png');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials (use test user)
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirect
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify error message
    await expect(page.getByRole('alert')).toContainText(/invalid/i);
    await expect(page).toHaveScreenshot('login-error.png');
  });
});
```

---

### Flow 2: Content Creation Tests

```typescript
// tests/ui/omnipost.spec.ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Content Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('opens content editor from dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /create content/i }).click();

    await expect(page.getByRole('textbox', { name: /content/i })).toBeVisible();
    await expect(page).toHaveScreenshot('content-editor-empty.png');
  });

  test('saves draft content', async ({ page }) => {
    await page.goto('/content/new');

    // Fill content
    await page
      .getByRole('textbox', { name: /content/i })
      .fill('Test content for multiple platforms');

    // Select platforms
    await page.getByLabel(/facebook/i).check();
    await page.getByLabel(/twitter/i).check();

    // Save draft
    await page.getByRole('button', { name: /save draft/i }).click();

    // Verify success
    await expect(page.getByText(/saved/i)).toBeVisible();
  });

  test('shows validation error for empty content', async ({ page }) => {
    await page.goto('/content/new');

    await page.getByRole('button', { name: /save draft/i }).click();

    await expect(page.getByText(/content is required/i)).toBeVisible();
    await expect(page).toHaveScreenshot('content-validation-error.png');
  });
});
```

---

### Flow 3: Content Publishing Tests

```typescript
// tests/ui/content-publishing.spec.ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Content Publishing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed: create test content via API
    await page.request.post('/api/content', {
      data: {
        content: 'Test content for publishing',
        platforms: ['facebook'],
        status: 'draft',
      },
    });

    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
  });

  test('opens schedule modal', async ({ page }) => {
    await page.goto('/content');

    // Select content item
    await page.getByText('Test content for publishing').click();
    await page.getByRole('button', { name: /schedule/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(/schedule/i);
    await expect(page).toHaveScreenshot('schedule-modal.png');
  });

  test('schedules content for future date', async ({ page }) => {
    await page.goto('/content');

    await page.getByText('Test content for publishing').click();
    await page.getByRole('button', { name: /schedule/i }).click();

    // Select date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.getByLabel(/date/i).fill(tomorrow.toISOString().split('T')[0]);

    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByText(/scheduled/i)).toBeVisible();
  });
});
```

---

### Flow 4: Campaign Management Tests

```typescript
// tests/ui/campaigns.spec.ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Campaign Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
  });

  test('displays campaign list', async ({ page }) => {
    await page.goto('/campaigns');

    await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();
    await expect(page).toHaveScreenshot('campaigns-list.png');
  });

  test('creates new campaign', async ({ page }) => {
    await page.goto('/campaigns');
    await page.getByRole('button', { name: /new campaign/i }).click();

    // Fill form
    await page.getByLabel(/name/i).fill('Test Campaign');
    await page.getByLabel(/description/i).fill('Test campaign description');

    // Select platforms
    await page.getByLabel(/facebook/i).check();
    await page.getByLabel(/instagram/i).check();

    // Save
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Test Campaign')).toBeVisible();
  });
});
```

---

### Flow 5: Dashboard Tests

```typescript
// tests/ui/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
  });

  test('displays dashboard with stats', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByTestId('stats-card')).toHaveCount(4);
    await expect(page).toHaveScreenshot('dashboard-overview.png');
  });

  test('shows recent content', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('region', { name: /recent content/i })).toBeVisible();
  });

  test('responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
```

---

## Companion Automated Tests

### Unit Tests (Jest)

| Flow             | Test File                         | Coverage                      |
| ---------------- | --------------------------------- | ----------------------------- |
| Authentication   | `__tests__/lib/auth.test.ts`      | Token validation, hash verify |
| Content Creation | `__tests__/api/content.test.ts`   | API validation, sanitization  |
| Publishing       | `__tests__/api/scheduler.test.ts` | Schedule logic, retry         |
| Campaigns        | `__tests__/api/campaigns.test.ts` | CRUD operations               |

### Integration Tests

| Flow             | Test File                               | Coverage                    |
| ---------------- | --------------------------------------- | --------------------------- |
| Authentication   | `__tests__/integration/auth.test.ts`    | Full login/logout cycle     |
| Content Creation | `__tests__/integration/content.test.ts` | Create → List → Update flow |

### Accessibility Tests (jest-axe)

```typescript
// __tests__/a11y/components.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  test('LoginForm has no accessibility violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('ContentEditor has no accessibility violations', async () => {
    const { container } = render(<ContentEditor />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Contract Tests

```typescript
// __tests__/contracts/api.test.ts
import { z } from 'zod';

const ContentResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    content: z.string(),
    platforms: z.array(z.string()),
    status: z.enum(['draft', 'scheduled', 'published']),
    createdAt: z.string(),
  }),
});

describe('API Contracts', () => {
  test('POST /api/content returns valid response', async () => {
    const response = await fetch('/api/content', {
      method: 'POST',
      body: JSON.stringify({ content: 'test', platforms: ['facebook'] }),
    });
    const data = await response.json();
    expect(() => ContentResponseSchema.parse(data)).not.toThrow();
  });
});
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm exec playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: screenshots
          path: test-results/
```

---

## Test Data Seeding Strategy

### Approach 1: API Mocking

```typescript
// tests/ui/fixtures/mocks.ts
import { Page } from '@playwright/test';

export async function mockAuthAPI(page: Page) {
  await page.route('/api/auth', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@example.com' },
      }),
    });
  });
}
```

### Approach 2: Database Seeding

```typescript
// tests/ui/fixtures/seed.ts
export async function seedTestData() {
  // Create test user
  await db.user.create({
    data: {
      email: 'test@example.com',
      password: await hash('testpassword', 12),
    },
  });

  // Create test content
  await db.content.createMany({
    data: [
      { content: 'Test post 1', status: 'draft' },
      { content: 'Test post 2', status: 'published' },
    ],
  });
}
```

---

## Snapshot Update Process

1. Run tests: `pnpm exec playwright test`
2. Review failures in `playwright-report/`
3. Update snapshots: `pnpm exec playwright test --update-snapshots`
4. Commit updated snapshots to repository
5. PR review includes visual diff comparison
