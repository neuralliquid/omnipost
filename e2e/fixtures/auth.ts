import { test as base, expect, type Page } from '@playwright/test';
import path from 'node:path';

const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

const TEST_USER = {
  username: 'admin',
  password: 'admin',
};

/**
 * Perform a full login via the UI and persist the session cookie / token
 * so that subsequent tests can skip the login form.
 */
async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(TEST_USER.username);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: /login/i }).click();

  // Wait until we land on the dashboard -- proves login succeeded
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page.locator('h1')).toBeVisible();
}

// ── Fixture that provides an already-authenticated page ──────────────
type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Extended test fixture that provides `authenticatedPage` -- a Page
 * instance whose browser context has been pre-loaded with saved auth
 * state so every test starts already logged-in.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../fixtures/auth';
 *
 * test('dashboard loads', async ({ authenticatedPage: page }) => {
 *   await page.goto('/dashboard');
 *   await expect(page).toHaveTitle(/Dashboard/);
 * });
 * ```
 */
/* eslint-disable react-hooks/rules-of-hooks -- Playwright's use() is not React's use() hook */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Try to reuse previously-saved auth state; fall back to fresh login
    let context;
    try {
      context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    } catch {
      // Storage state file missing -- perform a fresh login
      context = await browser.newContext();
      const page = await context.newPage();
      await loginViaUI(page);
      await context.storageState({ path: STORAGE_STATE_PATH });
    }

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export { TEST_USER };
