import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    highload: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 iterations per second
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 1000,
      maxVUs: 2000,
      exec: 'runHighLoad',
    },
  },
  thresholds: {
    'http_req_duration{suite:highload}': ['p(95)<500'],
    'checks{suite:highload}': ['rate>0.98'],
  },
};

const BASE_URL = __ENV.APP_URL || 'http://localhost:5000';

export function setup() {
  const headers = { 'Content-Type': 'application/json' };
  let token = '';
  try {
    const login = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email: 'perf@test.com', password: 'Perf!23456' }), { headers });
    if (login.status === 200 && login.json('accessToken')) token = login.json('accessToken');
  } catch {}
  return { token };
}

export function runHighLoad(data) {
  const headers = data.token ? { Authorization: `Bearer ${data.token}` } : {};
  const r = http.get(`${BASE_URL}/api/analytics/performance`, { headers, tags: { suite: 'highload' } });
  check(r, { 'analytics/performance OK/unauth': (res) => [200, 401].includes(res.status) }, { suite: 'highload' });
  sleep(0.01);
}


