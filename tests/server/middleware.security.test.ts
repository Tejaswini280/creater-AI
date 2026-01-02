import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import {
  createRateLimit,
  createUserRateLimit,
  corsOptions,
  validateInput,
  commonSchemas,
  sqlInjectionPrevention,
  xssPrevention,
  errorHandler,
  validateApiKey,
  generateApiKey,
  requireApiKeyPermission,
} from '../../server/middleware/security';

describe('middleware/security', () => {
  it('rate limit returns 429 after exceeding limit', async () => {
    const app = express();
    app.use(createRateLimit(50, 1));
    app.get('/ping', (_req, res) => res.json({ ok: true }));
    const agent = request(app);
    await agent.get('/ping').expect(200);
    await agent.get('/ping').expect(429);
  });

  it('validateInput returns 400 on schema error', async () => {
    const app = express();
    app.use(express.json());
    app.post('/auth/login', validateInput(commonSchemas.login), (_req, res) => res.json({ ok: true }));
    await request(app).post('/auth/login').send({ email: 'bad', password: 'short' }).expect(400);
  });

  it('sqlInjectionPrevention blocks malicious input', async () => {
    const app = express();
    app.use(express.json());
    app.use(sqlInjectionPrevention);
    app.post('/submit', (_req, res) => res.json({ ok: true }));
    await request(app).post('/submit').send({ q: '1; DROP TABLE users;' }).expect(400);
  });

  it('xssPrevention sanitizes script tags', async () => {
    const app = express();
    app.use(express.json());
    app.use(xssPrevention);
    app.post('/echo', (req, res) => res.json({ body: req.body }));
    const res = await request(app).post('/echo').send({ a: '<script>alert(1)</script>' }).expect(200);
    expect(res.body.body.a).toBe('');
  });

  it('errorHandler attaches security headers and formats errors', async () => {
    const app = express();
    app.get('/boom', (_req, _res, next: NextFunction) => next(new Error('fail')));
    app.use(errorHandler);
    const res = await request(app).get('/boom');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('validateApiKey accepts valid generated keys and enforces permissions', async () => {
    const app = express();
    const key = generateApiKey('user-1', ['read']);
    app.get('/secure', validateApiKey, requireApiKeyPermission('read'), (_req, res) => res.json({ ok: true }));
    await request(app).get('/secure').set('x-api-key', key).expect(200);
    await request(app).get('/secure').set('x-api-key', key + 'x').expect(401);
    app.get('/secure-write', validateApiKey, requireApiKeyPermission('write'), (_req, res) => res.json({ ok: true }));
    await request(app).get('/secure-write').set('x-api-key', key).expect(403);
  });

  it('corsOptions exposes expected headers', () => {
    expect(Array.isArray((corsOptions as any).exposedHeaders)).toBe(true);
    expect((corsOptions as any).methods).toContain('GET');
  });
});


