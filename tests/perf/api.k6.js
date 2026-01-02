import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  scenarios: {
    api: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      exec: 'apiTest',
    },
  },
  thresholds: {
    'http_req_duration{suite:api}': ['p(95)<500'],
    'checks{suite:api}': ['rate>0.99'],
  },
};

const BASE_URL = __ENV.APP_URL || 'http://localhost:5000';

export function setup() {
  // Attempt login, fallback to register then login
  const headers = { 'Content-Type': 'application/json' };
  let token = '';
  try {
    const login = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'perf@test.com', password: 'Perf!23456' }),
      { headers }
    );
    if (login.status === 200 && login.json('accessToken')) {
      token = login.json('accessToken');
    } else {
      const register = http.post(
        `${BASE_URL}/api/auth/register`,
        JSON.stringify({ email: 'perf@test.com', password: 'Perf!23456', firstName: 'Perf', lastName: 'User' }),
        { headers }
      );
      if (register.status === 201 || register.status === 200) {
        const login2 = http.post(
          `${BASE_URL}/api/auth/login`,
          JSON.stringify({ email: 'perf@test.com', password: 'Perf!23456' }),
          { headers }
        );
        if (login2.status === 200 && login2.json('accessToken')) {
          token = login2.json('accessToken');
        }
      }
    }
  } catch (e) {
    // ignore, continue without token for public endpoints
  }
  return { token };
}

export function apiTest(data) {
  const authHeaders = data.token ? { Authorization: `Bearer ${data.token}` } : {};

  group('public', () => {
    const r1 = http.get(`${BASE_URL}/api/health`, { tags: { suite: 'api' } });
    check(r1, { 'health 200': (r) => r.status === 200 }, { suite: 'api' });

    const r2 = http.get(`${BASE_URL}/api/metrics`, { tags: { suite: 'api' } });
    check(r2, { 'metrics 200': (r) => r.status === 200 }, { suite: 'api' });
  });

  group('content', () => {
    const headers = { ...authHeaders, 'Content-Type': 'application/json' };
    const list = http.get(`${BASE_URL}/api/content`, { headers, tags: { suite: 'api' } });
    check(list, { 'content 200/401': (r) => r.status === 200 || r.status === 401 }, { suite: 'api' });

    const analytics = http.get(`${BASE_URL}/api/content/analytics`, { headers, tags: { suite: 'api' } });
    check(analytics, { 'content analytics ok/unauth': (r) => r.status === 200 || r.status === 401 }, { suite: 'api' });
  });

  group('analytics', () => {
    const headers = { ...authHeaders, 'Content-Type': 'application/json' };
    const body = JSON.stringify({ content: 'AI tools', platform: 'youtube', audience: 'creators' });
    const pred = http.post(`${BASE_URL}/api/analytics/predict-performance`, body, { headers, tags: { suite: 'api' } });
    check(pred, { 'predict perf ok/unauth': (r) => r.status === 200 || r.status === 401 }, { suite: 'api' });
  });

  sleep(0.5);
}


