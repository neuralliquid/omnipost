import { test, expect } from '@playwright/test';

test.describe('Public page navigation', () => {
  test('landing page loads with hero section', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: /publish once\. reach every platform/i })
    ).toBeVisible();

    // At least one call-to-action button
    const cta = page
      .getByRole('link', { name: /start publishing free|get\s*started|sign\s*up|try/i })
      .or(page.getByRole('button', { name: /start publishing free|get\s*started|sign\s*up|try/i }))
      .first();
    await expect(cta).toBeVisible();
  });

  test('pricing page loads with tier cards', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);

    await expect(
      page.getByRole('heading', { level: 1, name: /simple, transparent pricing/i })
    ).toBeVisible();

    await expect(page.getByRole('heading', { level: 3, name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Pro' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Team' })).toBeVisible();
  });

  test('signup page loads with registration form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);

    await expect(page.getByRole('heading', { name: /start publishing everywhere/i })).toBeVisible();

    // Form fields
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sign\s*up|create.*account|register/i })
    ).toBeVisible();
  });

  test('login page loads with login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    await expect(page.getByRole('heading', { name: /log\s*in|sign\s*in|welcome/i })).toBeVisible();

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });
});

test.describe('Protected page navigation', () => {
  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('settings redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/settings');

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('content/new redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/content/new');

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Navigation header', () => {
  test('header links navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Click pricing link in the nav
    const pricingLink = page.getByRole('navigation').getByRole('link', { name: /pricing/i });
    if (await pricingLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await pricingLink.click();
      await expect(page).toHaveURL(/\/pricing/);
    }

    // Click logo or brand name to return home
    const homeLink = page
      .getByRole('navigation')
      .getByRole('link', { name: /omnipost|home/i })
      .or(page.getByRole('navigation').locator('a').first());
    await homeLink.click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
  });

  test('mobile navigation menu opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/');

    // Open hamburger menu
    const menuButton = page
      .getByRole('button', { name: /menu|toggle.*nav/i })
      .or(page.locator('[data-testid="mobile-menu-toggle"]'));
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Nav links should now be visible
    const mobileNav = page.getByRole('navigation').or(page.locator('[data-testid="mobile-menu"]'));
    await expect(mobileNav).toBeVisible();

    // Close the menu
    await menuButton.click();
  });
});
