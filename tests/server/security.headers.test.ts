import express from 'express';
import request from 'supertest';
import helmet from 'helmet';
import { corsOptions } from '../../server/middleware/security';
import cors from 'cors';

describe('security headers & CSP', () => {
  const buildApp = () => {
    const app = express();
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          mediaSrc: ["'self'", 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));
    app.use(cors(corsOptions));
    app.get('/ping', (_req, res) => res.json({ ok: true }));
    return app;
  };

  it('sets key security headers', async () => {
    const res = await request(buildApp()).get('/ping');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['content-security-policy']).toBeTruthy();
  });
});


