import { test, expect } from '@playwright/test';

test('health endpoint returns healthy', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toBe('healthy');
});


