import express from 'express';
import request from 'supertest';
import { SecurityMonitor } from '../../server/middleware/security';

describe('security monitor report endpoint (ad hoc)', () => {
  it('returns a minimal security report shape', async () => {
    const app = express();
    app.get('/api/security/report', (_req, res) => {
      const report = SecurityMonitor.getInstance().getSecurityReport();
      res.json({ ok: true, report });
    });
    const res = await request(app).get('/api/security/report').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.report).toHaveProperty('threatLevel');
    expect(Array.isArray(res.body.report.blockedIPs)).toBe(true);
  });
});


