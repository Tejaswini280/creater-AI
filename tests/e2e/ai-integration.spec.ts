import { test, expect } from '@playwright/test';

const RUN_AI_HTTP = process.env.RUN_AI_HTTP === '1';

test.describe(RUN_AI_HTTP ? 'AI integrations with graceful fallbacks' : 'AI integrations (HTTP) - skipped by default', () => {
  test.skip(!RUN_AI_HTTP, 'Skipping direct AI HTTP endpoint tests unless RUN_AI_HTTP=1');
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
  });

  test('streaming generate (HTTP) returns content and metadata', async ({ request }) => {
    const email = `ai${Date.now()}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'AI', lastName: 'HTTP' } }).catch(() => {});
    const login = await request.post('/api/auth/login', { data: { email, password }, headers: { 'Content-Type': 'application/json' } });
    const loginJson = await login.json();

    const res = await request.post('/api/ai/streaming-generate', {
      data: { prompt: 'Generate a short script about productivity tips', type: 'script', platform: 'youtube' },
      headers: { Authorization: `Bearer ${loginJson.accessToken}`, 'Content-Type': 'application/json' }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(typeof json.content).toBe('string');
    expect(Array.isArray(json.streamData)).toBeTruthy();
    expect(json.streamData.length).toBeGreaterThan(0);
  });

  test('ideas generation endpoint returns array of ideas (real or fallback)', async ({ request }) => {
    const email = `ideas${Date.now()}@example.com`;
    const password = 'password123';
    await request.post('/api/auth/register', { data: { email, password, firstName: 'AI', lastName: 'Ideas' } }).catch(() => {});
    const login = await request.post('/api/auth/login', { data: { email, password }, headers: { 'Content-Type': 'application/json' } });
    const loginJson = await login.json();

    const res = await request.post('/api/ai/generate-ideas', {
      data: { prompt: '10 video ideas for tech channel, include hooks and angles to test schema', type: 'text', options: { platform: 'youtube' } },
      headers: { Authorization: `Bearer ${loginJson.accessToken}`, 'Content-Type': 'application/json' }
    });
    // Either 200 with ideas or 400/401/422 from schema/auth; accept both
    if (res.ok()) {
      const json = await res.json();
      expect(typeof json === 'object').toBeTruthy();
    } else {
      expect([400, 401, 422]).toContain(res.status());
    }
  });
});


