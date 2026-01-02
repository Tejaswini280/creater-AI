import express, { type NextFunction } from 'express';
import request from 'supertest';
import {
  sqlInjectionPrevention,
  enhancedSecurityAuditLog,
  SecurityMonitor,
  validateContentType,
  fileSizeLimit,
  validateApiKey,
  getApiKeyInfo,
  generateApiKey,
  errorHandler,
} from '../../server/middleware/security';

describe('middleware/security branch coverage', () => {
  it('sqlInjectionPrevention: AI route allows SQL keywords but blocks comments', async () => {
    const app = express();
    app.use(express.json());
    app.use(sqlInjectionPrevention);
    app.post('/api/ai/prompt', (req, res) => res.json({ ok: true, body: req.body }));
    // Allowed (keyword only)
    await request(app).post('/api/ai/prompt').send({ q: 'select * from users' }).expect(200);
    // Blocked (comment token)
    await request(app).post('/api/ai/prompt').send({ q: '-- injected' }).expect(400);
  });

  it('enhancedSecurityAuditLog: accessing admin path without user is flagged but not blocked', async () => {
    const app = express();
    app.use(enhancedSecurityAuditLog);
    app.get('/admin/settings', (_req, res) => res.json({ ok: true }));
    await request(app).get('/admin/settings').expect(200);
  });

  it('validateContentType and fileSizeLimit success paths', async () => {
    const app = express();
    app.post('/upload', validateContentType(['application/json']), fileSizeLimit(1000), (_req, res) => res.json({ ok: true }));
    await request(app).post('/upload').set('Content-Type', 'application/json').send('{}').expect(200);
  });

  it('validateApiKey: expired key branch returns 401', async () => {
    const key = generateApiKey('user-x', ['read']);
    const info = getApiKeyInfo(key)!;
    info.expiresAt = new Date(Date.now() - 1000);

    const app = express();
    app.get('/secure', validateApiKey, (_req, res) => res.json({ ok: true }));
    await request(app).get('/secure').set('x-api-key', key).expect(401);
  });

  it('SecurityMonitor threat level increase and reset paths', () => {
    const monitor = SecurityMonitor.getInstance();
    const before = monitor.getThreatLevel();
    monitor.recordSuspiciousActivity('1.2.3.4', 'low-test', 'low');
    monitor.recordSuspiciousActivity('1.2.3.4', 'med-test', 'medium');
    monitor.recordSuspiciousActivity('1.2.3.4', 'crit-test', 'critical');
    expect(monitor.getThreatLevel()).toBeGreaterThanOrEqual(before + 14);
    monitor.resetThreatLevel();
    expect(monitor.getThreatLevel()).toBeGreaterThanOrEqual(0);
  });

  it('errorHandler uses generic message in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const app = express();
    app.get('/boom', (_req, _res, next: NextFunction) => next(new Error('sensitive details')));
    app.use(errorHandler);
    const res = await request(app).get('/boom').expect(500);
    expect(res.body.message).toBe('Internal Server Error');
    process.env.NODE_ENV = prev;
  });
});


