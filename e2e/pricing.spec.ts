import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('all 3 tier cards are visible', async ({ page }) => {
    const tierCards = page.locator(
      '[data-testid="pricing-tier"], [class*="pricingCard"], [class*="PricingCard"], [class*="tier"]'
    );
    await expect(tierCards).toHaveCount(3);

    // Each card should have a plan name, a price, and a CTA button
    for (let i = 0; i < 3; i++) {
      const card = tierCards.nth(i);
      await expect(card).toBeVisible();

      // Plan name heading
      await expect(card.getByRole('heading')).toBeVisible();

      // Price value (e.g. "$29", "Free", "$99")
      const priceText = card.locator(
        '[data-testid="price"], [class*="price"], [class*="Price"]'
      ).or(card.getByText(/\$\d+|free/i));
      await expect(priceText.first()).toBeVisible();

      // CTA button
      const cta = card.getByRole('link', { name: /get\s*started|sign\s*up|choose|select|start/i }).or(
        card.getByRole('button', { name: /get\s*started|sign\s*up|choose|select|start/i })
      );
      await expect(cta).toBeVisible();
    }
  });

  test('billing toggle switches between monthly and annual prices', async ({ page }) => {
    // Find the billing toggle
    const billingToggle = page.getByRole('switch', { name: /annual|yearly|billing/i }).or(
      page.getByLabel(/annual|yearly|billing/i)
    ).or(
      page.locator('[data-testid="billing-toggle"]')
    );
    await expect(billingToggle).toBeVisible();

    // Capture initial prices
    const priceElements = page.locator(
      '[data-testid="price"], [class*="price"], [class*="Price"]'
    );
    const initialPrices: string[] = [];
    const priceCount = await priceElements.count();
    for (let i = 0; i < priceCount; i++) {
      const text = await priceElements.nth(i).textContent();
      initialPrices.push(text ?? '');
    }

    // Toggle billing period
    await billingToggle.click();

    // Wait for price update
    await page.waitForTimeout(500);

    // Capture updated prices
    const updatedPrices: string[] = [];
    for (let i = 0; i < priceCount; i++) {
      const text = await priceElements.nth(i).textContent();
      updatedPrices.push(text ?? '');
    }

    // At least one price should have changed (unless all plans are free)
    const hasChanged = initialPrices.some((price, i) => price !== updatedPrices[i]);
    expect(hasChanged).toBe(true);
  });

  test('CTA buttons link to signup with plan parameter', async ({ page }) => {
    const tierCards = page.locator(
      '[data-testid="pricing-tier"], [class*="pricingCard"], [class*="PricingCard"], [class*="tier"]'
    );

    const cardCount = await tierCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = tierCards.nth(i);
      const cta = card.getByRole('link', { name: /get\s*started|sign\s*up|choose|select|start/i });

      if (await cta.isVisible({ timeout: 1_000 }).catch(() => false)) {
        const href = await cta.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toMatch(/\/signup/);
        // Should include a plan parameter (e.g. ?plan=pro)
        expect(href).toMatch(/[?&]plan=/);
      }
    }
  });

  test('FAQ accordion opens and closes', async ({ page }) => {
    // Scroll to FAQ section
    const faqSection = page.locator(
      '[data-testid="faq"], section[class*="faq"], section[class*="FAQ"]'
    ).or(page.getByRole('heading', { name: /faq|frequently/i }).locator('..'));

    await faqSection.scrollIntoViewIfNeeded();

    // Find accordion items
    const accordionItems = page.locator(
      '[data-testid="faq-item"], [class*="accordion"], details'
    ).or(
      page.getByRole('button').filter({ hasText: /\?/ })
    );
    const itemCount = await accordionItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Click the first question to open it
    const firstItem = accordionItems.first();
    const trigger = firstItem.getByRole('button').or(firstItem.locator('summary')).or(firstItem);
    await trigger.click();

    // Answer text should be visible
    const answerPanel = page.locator(
      '[data-testid="faq-answer"], [class*="accordionContent"], [class*="AccordionContent"], [role="region"]'
    ).or(firstItem.locator('p'));
    await expect(answerPanel.first()).toBeVisible({ timeout: 3_000 });

    // Click again to close
    await trigger.click();

    // Answer panel should be hidden (or details closed)
    // Use a soft check since animation timing varies
    await page.waitForTimeout(500);
    const isHidden = await answerPanel.first().isHidden().catch(() => true);
    expect(isHidden).toBe(true);
  });

  test('feature lists are visible in each tier', async ({ page }) => {
    const tierCards = page.locator(
      '[data-testid="pricing-tier"], [class*="pricingCard"], [class*="PricingCard"], [class*="tier"]'
    );

    const cardCount = await tierCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = tierCards.nth(i);

      // Each tier should list features
      const features = card.getByRole('list').or(
        card.locator('[data-testid="feature-list"], [class*="feature"]')
      );
      await expect(features.first()).toBeVisible();

      // Should have at least one list item / feature
      const featureItems = card.getByRole('listitem').or(
        card.locator('[data-testid="feature-item"]')
      );
      const featureCount = await featureItems.count();
      expect(featureCount).toBeGreaterThanOrEqual(1);
    }
  });
});
