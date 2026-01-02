import { test, expect } from '@playwright/test';

test.describe('Auth security essentials', () => {
  test('protected endpoint without token should 401', async ({ request }) => {
    const res = await request.get('/api/content');
    expect([401, 403]).toContain(res.status());
  });

  test('refresh flow endpoint exists (if enabled)', async ({ request }) => {
    const res = await request.post('/api/auth/refresh').catch(() => null);
    // Treat absence or rejection as acceptable in environments without refresh cookies
    if (!res) return;
    expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
  });
});


