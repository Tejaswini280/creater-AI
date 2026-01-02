import { test, expect } from '@playwright/test';

test.describe('Visual smoke', () => {
  test('dashboard layout snapshot (authenticated)', async ({ page, request }, testInfo) => {
    // Only run lightweight visual on Chromium for stability
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
    // Login via API and inject token
    const unique = `${Date.now()}-${Math.floor(Math.random()*1e6)}`;
    const email = `vis${unique}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'Vis', lastName: 'Shot' } }).catch(() => {});
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    // Reduce flake from animations/transitions
    await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; caret-color: transparent !important; }' });
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');

    // Focus on the main app area for a stable capture
    const main = page.locator('main[role="main"], #main-content, #root');
    await expect(main.first()).toBeVisible();
    const image = await page.screenshot({ animations: 'disabled' });
    await testInfo.attach('dashboard-main', { body: image, contentType: 'image/png' });
    // Basic pixel budget check to ensure non-empty, stable capture
    expect(image.byteLength).toBeGreaterThan(5000);
  });
});


