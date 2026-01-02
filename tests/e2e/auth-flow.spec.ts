import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('register, login, and reach dashboard', async ({ page, request }) => {
    // Create user via API for determinism
    const unique = `${Date.now()}-${Math.floor(Math.random()*1e6)}`;
    const email = `user${unique}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', {
      data: { email, password, firstName: 'Play', lastName: 'Wright' }
    }).catch(() => {});

    // Login via API
    const loginRes = await request.post('/api/auth/login', { data: { email, password } });
    const loginJson = await loginRes.json();

    // Inject token and user before any page scripts run
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    // Navigate to dashboard and verify we are not redirected to login
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login$/);
  });
});


