import { test, expect } from '@playwright/test';

test.describe('GDPR & Privacy', () => {
  test('cookie consent banner appears and can accept/manage', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'webkit') test.skip();
    await page.context().clearCookies();
    await page.goto('/');
    // Ensure banner visible
    const dialog = page.getByRole('dialog', { name: /cookie consent/i });
    // If banner not immediately visible (race), allow a short wait then retry
    try {
      await expect(dialog).toBeVisible({ timeout: 15000 });
    } catch {
      // Attempt to reload once after clearing cookies
      await page.context().clearCookies();
      await page.reload();
      await expect(dialog).toBeVisible({ timeout: 15000 });
    }

    // Open manage, toggle analytics, save
    await page.getByRole('button', { name: /manage/i }).click();
    const analyticsSwitch = dialog.locator('button[role="switch"]').nth(1);
    await analyticsSwitch.click();
    await page.getByRole('button', { name: /save preferences/i }).click();
    await expect(dialog).toBeHidden();

    // Cookie should be set
    const cookies = await page.context().cookies();
    const hasConsent = cookies.some(c => c.name === 'cookie_consent');
    expect(hasConsent).toBeTruthy();
  });

  test('privacy and terms pages are accessible', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'webkit') test.skip();
    await page.context().clearCookies();
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
  });

  test('data export endpoint works with auth', async ({ page, request }) => {
    const unique = `${Date.now()}-${Math.floor(Math.random()*1e6)}`;
    const email = `gdpr${unique}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'GD', lastName: 'PR' } }).catch(() => {});
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();
    const token = loginJson.accessToken || 'test-token';

    // Try primary path; if not found (404), fallback to alt path present in server
    let exportRes = await request.get('/api/user/data-export', { headers: { Authorization: `Bearer ${token}` } });
    if (exportRes.status() === 404) {
      exportRes = await request.get('/api/user/export-data', { headers: { Authorization: `Bearer ${token}` } });
    }
    expect([200]).toContain(exportRes.status());
    const body: any = await exportRes.json();
    // Accept legacy wrapped shape (server now returns legacy for compatibility)
    const hasTopLevel = body && (body.generatedAt || body.user);
    const hasWrapped = body && body.data && (body.data.exportDate || body.data.user);
    expect(hasTopLevel || hasWrapped).toBeTruthy();
  });

  test('delete account endpoint works (alias)', async ({ page, request }) => {
    const unique = `${Date.now()}-${Math.floor(Math.random()*1e6)}`;
    const email = `erase${unique}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'Erase', lastName: 'Me' } }).catch(() => {});
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();
    const token = loginJson.accessToken || 'test-token';

    // Try alias; fallback to canonical endpoint if not present
    let delRes = await request.delete('/api/user/delete', { headers: { Authorization: `Bearer ${token}` } });
    if (delRes.status() === 404) {
      delRes = await request.delete('/api/user/account', { headers: { Authorization: `Bearer ${token}` } });
    }
    expect([200, 204]).toContain(delRes.status());
    // Repeat delete should be idempotent-like (still 200 range)
    let delRes2 = await request.delete('/api/user/delete', { headers: { Authorization: `Bearer ${token}` } });
    if (delRes2.status() === 404) {
      delRes2 = await request.delete('/api/user/account', { headers: { Authorization: `Bearer ${token}` } });
    }
    // Accept 200/204 when alias exists; if account already removed token may be invalid -> 401/403 acceptable
    expect([200, 204, 401, 403]).toContain(delRes2.status());
  });
});


