import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { authRateLimit, errorHandler } from '../../server/middleware/security';

describe('auth brute-force mitigation (rate limit)', () => {
  it('limits repeated auth attempts', async () => {
    const app = express();
    app.use(authRateLimit);
    app.post('/api/auth/login', (_req, res) => res.status(401).json({ ok: false }));
    app.use(errorHandler);

    // 5 allowed, 6th should 429 (as implemented)
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ u: 'x', p: 'y' }).expect(401);
    }
    await request(app).post('/api/auth/login').send({ u: 'x', p: 'y' }).expect(429);
  });
});


