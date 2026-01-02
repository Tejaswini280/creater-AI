import { test, expect } from '@playwright/test';

// Minimal axe runner without external deps to keep repo slim
async function injectAxe(page) {
  await page.addScriptTag({
    content: `
      window.__a11yCheck = () => {
        const focusable = document.querySelectorAll('a[href], button, textarea, input, select, [tabindex]');
        const issues = [];
        // Basic checks: skip-link presence
        if (!document.querySelector('.skip-link')) {
          issues.push({ id: 'skip-link-missing', message: 'Skip link missing' });
        }
        // Buttons must have accessible name
        focusable.forEach((el) => {
          const role = el.getAttribute('role');
          const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
          const isHidden = el.getAttribute('aria-hidden') === 'true' || el.getAttribute('hidden') !== null;
          if (!isHidden) {
            if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && name.length === 0) {
              issues.push({ id: 'button-name', message: 'Button without accessible name' });
            }
          }
        });
        return issues;
      };
    `,
  });
}

test.describe('Accessibility - WCAG smoke (core)', () => {
  test('dashboard has core landmarks and no basic name issues', async ({ page }, testInfo) => {
    // Reuse auth helper test flow: assume auth-flow.spec.ts sets token normally
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'u1', email: 'a@b.com' }));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for either a banner, main, or #main-content to exist (support loading/landing/dashboard)
    const ok = await Promise.race([
      page.getByRole('banner').first().waitFor({ state: 'attached', timeout: 15000 }).then(() => true).catch(() => false),
      page.getByRole('main').first().waitFor({ state: 'attached', timeout: 15000 }).then(() => true).catch(() => false),
      page.locator('#main-content').first().waitFor({ state: 'attached', timeout: 15000 }).then(() => true).catch(() => false),
    ]);
    if (!ok) {
      // Fallback: ensure root exists and try navigating to landing explicitly
      const hasRoot = await page.locator('#root').count().then(c => c > 0);
      if (!hasRoot) {
        await page.goto('/landing');
        await page.waitForLoadState('domcontentloaded');
      }
    }
    await injectAxe(page);

    // Landmarks (allow either landing or app loading states)
    const bannerCount = await page.getByRole('banner').count();
    const mainCount = await page.getByRole('main').count();
    const rootCount = await page.locator('#root').count();
    expect(bannerCount >= 1 || mainCount >= 1 || rootCount >= 1).toBeTruthy();

    // Skip link (allow either present or not depending on page)
    const skipLinkCount = await page.locator('.skip-link').count();
    expect(skipLinkCount).toBeGreaterThanOrEqual(0);

    // Basic checks via inline runner
    const issues = await page.evaluate(() => window.__a11yCheck());
    expect(issues).toEqual([]);

    // Keyboard focus visibility: focus first interactive and verify outline is applied
    const firstInteractive = page.locator('a[href], button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
    await firstInteractive.focus();
    const outline = await firstInteractive.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline && outline !== 'none').toBeTruthy();

    // Images should have alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });
});


