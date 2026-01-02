import http from 'k6/http';
import { sleep, check, Trend } from 'k6';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    'http_req_duration{suite:mem}': ['p(95)<800'],
    'checks{suite:mem}': ['rate>0.99'],
  },
};

const BASE_URL = __ENV.APP_URL || 'http://localhost:5000';
const heapUsed = new Trend('heap_used_bytes');

export default function () {
  const res = http.get(`${BASE_URL}/api/metrics`, { tags: { suite: 'mem' } });
  check(res, { 'metrics ok': (r) => r.status === 200 }, { suite: 'mem' });
  try {
    const m = res.json();
    if (m && m.heapUsed) heapUsed.add(m.heapUsed);
  } catch {}
  sleep(1);
}


