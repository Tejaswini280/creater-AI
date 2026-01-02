import { test, expect } from '@playwright/test';

test.describe('Scheduler basic flow', () => {
  test('visit scheduler page (basic render)', async ({ page, request }) => {
    // Ensure seed user exists and inject token
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

    await page.goto('/scheduler');
    await expect(page).toHaveURL(/\/scheduler$/);
  });
});


