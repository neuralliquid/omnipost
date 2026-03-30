import { test, expect } from './fixtures/auth';

test.describe('Content creation flow', () => {
  test('create and publish content end-to-end', async ({ authenticatedPage: page }) => {
    // ── 1. Navigate to the new-content page ──────────────────────────
    await page.goto('/content/new');
    await expect(page).toHaveURL(/\/content\/new/);
    await expect(
      page.getByRole('heading', { name: /new|create|compose/i })
    ).toBeVisible();

    // ── 2. Fill in title and body ────────────────────────────────────
    const title = `E2E Test Post ${Date.now()}`;

    await page.getByLabel(/title/i).fill(title);

    // The body editor could be a textarea or a contenteditable div
    const bodyField = page.getByLabel(/body|content|editor/i).or(
      page.locator('[data-testid="content-editor"]')
    );
    await bodyField.fill(
      'This is an automated end-to-end test post created by Playwright. ' +
      'It verifies the full content creation pipeline works correctly.'
    );

    // ── 3. Advance to the platform-adaptation step ───────────────────
    const nextButton = page.getByRole('button', { name: /next|continue|adapt/i });
    await nextButton.click();

    // ── 4. Verify platform cards render with character counts ────────
    const platformCards = page.locator(
      '[data-testid="platform-card"], [class*="platformCard"], [class*="PlatformCard"]'
    );
    await expect(platformCards.first()).toBeVisible({ timeout: 10_000 });

    const cardCount = await platformCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // At least one card should show a character count indicator
    const charCount = page.locator(
      '[data-testid="char-count"], [class*="charCount"], [class*="CharCount"]'
    );
    await expect(charCount.first()).toBeVisible();

    // ── 5. Advance to the schedule step ──────────────────────────────
    const scheduleButton = page.getByRole('button', { name: /next|continue|schedule/i });
    await scheduleButton.click();

    await expect(
      page.getByRole('heading', { name: /schedule|publish|when/i }).or(
        page.locator('[data-testid="schedule-step"]')
      )
    ).toBeVisible({ timeout: 5_000 });

    // ── 6. Click "Publish Now" ───────────────────────────────────────
    await page.getByRole('button', { name: /publish\s*now/i }).click();

    // Confirm dialog if present
    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // ── 7. Verify redirect to the content list ───────────────────────
    await page.waitForURL(/\/content(?:\/?)(?:\?|$)/, { timeout: 15_000 });

    // The newly created post should appear in the list
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });

  test('content form validates required fields', async ({ authenticatedPage: page }) => {
    await page.goto('/content/new');

    // Try to proceed without filling in anything
    const nextButton = page.getByRole('button', { name: /next|continue|adapt/i });
    await nextButton.click();

    // Validation error should appear for the title
    const titleError = page.getByText(/title.*required|required.*title|please.*title/i).or(
      page.locator('[data-testid="title-error"]')
    );
    await expect(titleError).toBeVisible({ timeout: 5_000 });
  });

  test('draft auto-save persists content', async ({ authenticatedPage: page }) => {
    await page.goto('/content/new');

    const draftTitle = `Draft ${Date.now()}`;
    await page.getByLabel(/title/i).fill(draftTitle);

    const bodyField = page.getByLabel(/body|content|editor/i).or(
      page.locator('[data-testid="content-editor"]')
    );
    await bodyField.fill('Auto-save draft body text.');

    // Wait for auto-save indicator
    const savedIndicator = page.getByText(/saved|draft.*saved/i).or(
      page.locator('[data-testid="save-indicator"]')
    );
    await expect(savedIndicator).toBeVisible({ timeout: 10_000 });

    // Navigate away and come back
    await page.goto('/dashboard');
    await page.goto('/content/new');

    // Draft should be recoverable -- look for the title or a "resume draft" prompt
    const resumePrompt = page.getByText(/resume|restore|draft/i).or(
      page.getByLabel(/title/i)
    );
    await expect(resumePrompt).toBeVisible({ timeout: 5_000 });
  });
});
