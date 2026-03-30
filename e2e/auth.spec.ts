import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('full signup -> onboarding -> dashboard flow', async ({ page }) => {
    // ── 1. Navigate to signup ────────────────────────────────────────
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /sign\s*up|create.*account/i })).toBeVisible();

    // ── 2. Fill in the registration form ─────────────────────────────
    const uniqueSuffix = Date.now();
    const testEmail = `e2e-signup-${uniqueSuffix}@omnipost.dev`;

    await page.getByLabel('Username').fill(`testuser${uniqueSuffix}`);
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass#2026');

    // Accept terms if a checkbox is present
    const termsCheckbox = page.getByRole('checkbox', { name: /terms|agree/i });
    if (await termsCheckbox.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    // ── 3. Submit the form ───────────────────────────────────────────
    await page.getByRole('button', { name: /sign\s*up|create.*account|register/i }).click();

    // ── 4. Verify redirect to onboarding ─────────────────────────────
    await page.waitForURL('**/onboarding', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding/);

    // ── 5. Complete onboarding steps ─────────────────────────────────
    // Step 1 -- choose connected platforms
    const platformCard = page.locator('[data-testid="platform-card"]').first();
    if (await platformCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await platformCard.click();
    }

    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();

    // Step 2 -- choose content categories / interests
    const categoryOption = page.locator('[data-testid="category-option"]').first();
    if (await categoryOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await categoryOption.click();
    }
    await nextButton.click();

    // Step 3 -- confirm / finish
    const finishButton = page.getByRole('button', { name: /finish|get\s*started|complete/i });
    if (await finishButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await finishButton.click();
    }

    // ── 6. Verify redirect to dashboard ──────────────────────────────
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login with existing credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /log\s*in|sign\s*in/i })).toBeVisible();

    await page.getByLabel('Email').fill('e2e-test@omnipost.dev');
    await page.getByLabel('Password').fill('Test1234!Secure');
    await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@omnipost.dev');
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/);
    const errorMessage = page.getByRole('alert').or(page.locator('[data-testid="auth-error"]'));
    await expect(errorMessage).toBeVisible({ timeout: 5_000 });
  });

  test('logout returns to landing page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('e2e-test@omnipost.dev');
    await page.getByLabel('Password').fill('Test1234!Secure');
    await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // Find and click logout
    const userMenu = page.getByRole('button', { name: /menu|profile|account/i });
    if (await userMenu.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await userMenu.click();
    }
    await page.getByRole('button', { name: /log\s*out|sign\s*out/i }).or(
      page.getByRole('menuitem', { name: /log\s*out|sign\s*out/i })
    ).click();

    // Should redirect away from dashboard
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
