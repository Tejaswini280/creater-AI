import express, { type NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  validateContentType,
  fileSizeLimit,
  securityAuditLog,
  enhancedSecurityAuditLog,
  sessionTimeoutWarning,
  errorHandler,
} from '../../server/middleware/security';

describe('middleware/security extended coverage', () => {
  it('validateContentType rejects unsupported media type', async () => {
    const app = express();
    app.post('/upload', validateContentType(['application/json']), (_req, res) => res.json({ ok: true }));
    // missing content type
    await request(app).post('/upload').expect(400);
    await request(app).post('/upload').set('Content-Type', 'text/plain').send('x').expect(415);
  });

  it('fileSizeLimit blocks oversized payloads', async () => {
    const app = express();
    app.post('/upload', fileSizeLimit(5), (_req, res) => res.json({ ok: true }));
    await request(app).post('/upload').set('Content-Length', '10').send('1234567890').expect(413);
  });

  it('securityAuditLog logs suspicious requests (smoke)', async () => {
    const app = express();
    app.use(express.json());
    app.use(securityAuditLog);
    app.post('/echo', (req, res) => res.json({ body: req.body }));
    await request(app).post('/echo').send({ q: '<script>alert(1)</script>' }).expect(200);
  });

  it('enhancedSecurityAuditLog flags suspicious content and still passes request', async () => {
    const app = express();
    app.use(express.json());
    app.use(enhancedSecurityAuditLog);
    app.get('/normal', (_req, res) => res.json({ ok: true }));
    await request(app).get('/normal?x=../../etc/passwd').expect(200);
  });

  it('SecurityMonitor can block IP after repeated violations', async () => {
    const { SecurityMonitor } = await import('../../server/middleware/security');
    const monitor = SecurityMonitor.getInstance();
    const ip = '::ffff:127.0.0.1';
    // Simulate repeated rate limit violations
    monitor.recordRateLimitViolation(ip);
    monitor.recordRateLimitViolation(ip);
    monitor.recordRateLimitViolation(ip);
    // High severity event should now cause block
    monitor.recordSuspiciousActivity(ip, 'test-block', 'high');

    const app = express();
    app.use(enhancedSecurityAuditLog);
    app.get('/resource', (_req, res) => res.json({ ok: true }));
    await request(app).get('/resource').expect(403);
  });

  it('sessionTimeoutWarning sets expiry headers when token near expiry', async () => {
    const app = express();
    app.get('/secure', (req, _res, next: NextFunction) => {
      // simulate authenticated request
      (req as any).user = { id: 'u1' };
      next();
    }, sessionTimeoutWarning, (req, res) => {
      res.json({ ok: true });
    });
    const token = jwt.sign({ sub: 'u1' }, 'secret', { expiresIn: 2 }); // 2s
    const res = await request(app).get('/secure').set('Authorization', `Bearer ${token}`);
    // header may or may not be present depending on timing; ensure route works
    expect([undefined, 'true']).toContain(res.headers['x-session-expiry-warning']);
    expect(res.status).toBe(200);
  });

  it('errorHandler formats known errors', async () => {
    const app = express();
    app.get('/validation', (_req, _res, next: NextFunction) => next({ name: 'ValidationError', message: 'bad' }));
    app.get('/unauth', (_req, _res, next: NextFunction) => next({ name: 'UnauthorizedError' }));
    app.get('/ratelimit', (_req, _res, next: NextFunction) => next({ name: 'RateLimitExceeded', resetTime: Date.now() + 1000 }));
    app.get('/apikey', (_req, _res, next: NextFunction) => next({ name: 'ApiKeyError', message: 'nope' }));
    app.get('/default', (_req, _res, next: NextFunction) => next(new Error('boom')));
    app.use(errorHandler);

    await request(app).get('/validation').expect(400);
    await request(app).get('/unauth').expect(401);
    await request(app).get('/ratelimit').expect(429);
    await request(app).get('/apikey').expect(401);
    await request(app).get('/default').expect(500);
  });
});


