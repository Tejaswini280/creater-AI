import { test, expect } from '@playwright/test';

test.describe('Phase 7 Task 7.4 - Documentation & Help', () => {
  test('quick actions show tooltips on hover/focus', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'webkit') test.skip();
    // Auth to access dashboard
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test-user-id', email: 'test@example.com' }));
    });
    await page.goto('/');
    // Dismiss cookie banner if present (can intercept hover)
    const consentDialog = page.getByRole('dialog', { name: /cookie consent/i });
    if (await consentDialog.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /accept all/i }).click();
      await expect(consentDialog).toBeHidden();
    }
    // Navigate to a page where QuickActions is rendered for sure (dashboard requires auth already set by initScript)
    await page.goto('/');
    // Hover a quick action (Create Video)
    const qa = page.getByRole('button', { name: /create video/i }).first();
    await qa.hover();
    // Tooltip content equals description
    await expect(page.getByText(/generate ai-powered video content/i)).toBeVisible();
  });
  test('public docs pages render with accessible headings', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'webkit') test.skip();
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: /documentation/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/api-docs');
    await expect(page.getByRole('heading', { name: /api documentation/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/tutorials');
    await expect(page.getByRole('heading', { name: /tutorials/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/developer-docs');
    await expect(page.getByRole('heading', { name: /developer documentation/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/troubleshooting');
    await expect(page.getByRole('heading', { name: /troubleshooting/i })).toBeVisible({ timeout: 15000 });
  });

  test('floating help button opens help menu with links', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'webkit') test.skip();
    // Make sure app bootstraps (public route)
    await page.goto('/');
    const help = page.getByRole('button', { name: /open help menu/i });
    await expect(help).toBeVisible();
    await help.click();
    // the menu uses role="dialog"; ensure it appears
    const dialog = page.getByRole('dialog', { name: /help & documentation/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('link', { name: /documentation/i })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /faq/i })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /api docs/i })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /tutorials/i })).toBeVisible();
  });
});


