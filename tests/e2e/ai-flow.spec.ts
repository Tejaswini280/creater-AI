import { test, expect } from '@playwright/test';

test.describe('AI generation smoke', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
  });

  test('AI page loads while authenticated', async ({ page, request }) => {
    const email = 'seed@example.com';
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'Seed', lastName: 'User' } }).catch(() => {});
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    await page.goto('/ai');
    await expect(page).toHaveURL(/\/ai$/);
  });
});


