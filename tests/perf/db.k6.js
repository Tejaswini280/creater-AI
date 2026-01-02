import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration{suite:db}': ['p(95)<500'],
    'checks{suite:db}': ['rate>0.99'],
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

export default function (data) {
  const headers = data.token ? { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // Hit endpoints likely to query DB heavily
  const endpoints = [
    ['GET', '/api/content'],
    ['GET', '/api/content/recent'],
    ['GET', '/api/content/scheduled'],
    ['GET', '/api/analytics/performance'],
  ];

  for (const [method, path] of endpoints) {
    const url = `${BASE_URL}${path}`;
    const res = method === 'GET' ? http.get(url, { headers, tags: { suite: 'db' } }) : http.request(method, url, null, { headers, tags: { suite: 'db' } });
    check(res, { [`${method} ${path} ok/unauth`]: (r) => [200, 401].includes(r.status) }, { suite: 'db' });
    sleep(0.2);
  }
}


