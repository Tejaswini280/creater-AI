import request from 'supertest';
import type { Server } from 'http';

// Spin up the actual server via the app entry which binds to port 5000.
// For isolation, we import the registerRoutes and create a transient server instance.
import express from 'express';

// NOTE: This suite is temporarily skipped to avoid heavy TS transpilation of the large server/router in CI.
// It will be enabled after we add a lightweight test app export.
describe.skip('Server basic endpoints', () => {
  let server: Server;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.SKIP_RATE_LIMIT = '1';
    const app = express();
    const { registerRoutes } = await import('../../server/routes');
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /api/health returns healthy', async () => {
    const res = await request(server).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/metrics returns ok', async () => {
    const res = await request(server).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });
});


