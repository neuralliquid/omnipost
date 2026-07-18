import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('signup page renders the alpha registration form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /start publishing everywhere/i })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /create free account/i })).toBeVisible();
  });

  test('login with development credentials reaches dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('nonexistent');
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: /login/i }).click();

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/);
    const errorMessage = page.getByRole('alert').or(page.locator('[data-testid="auth-error"]'));
    await expect(errorMessage).toBeVisible({ timeout: 5_000 });
  });

  test('protected dashboard redirects without an auth token', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
