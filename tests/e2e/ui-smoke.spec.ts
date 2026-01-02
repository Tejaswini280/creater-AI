import { test, expect } from '@playwright/test';

test.describe('UI smoke navigation', () => {
  test('landing -> login -> after login navigate core pages', async ({ page, request }) => {
    // Ensure seed user exists and log in via API, then inject token
    const email = 'seed@example.com';
    const password = 'password123';
    await request.post('/api/auth/register', {
      data: { email, password, firstName: 'Seed', lastName: 'User' }
    }).catch(() => {});
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    // Go directly to dashboard
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login$/);

    // Navigate to a few key pages
    // Templates
    await page.goto('/templates');
    await expect(page).toHaveURL(/\/templates$/);

    // AI Generator
    await page.goto('/ai');
    await expect(page).toHaveURL(/\/ai$/);

    // Scheduler
    await page.goto('/scheduler');
    await expect(page).toHaveURL(/\/scheduler$/);

    // Notifications
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications$/);
  });
});


