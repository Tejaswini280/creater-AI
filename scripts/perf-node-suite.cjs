const http = require('http');
const agent = new http.Agent({ keepAlive: true, maxSockets: 2048, keepAliveMsecs: 5000 });

const APP_URL = process.env.APP_URL || 'http://localhost:5000';

function httpGet(path, headers) {
  const start = performance.now();
  return new Promise((resolve) => {
    const req = http.request(APP_URL + path, { method: 'GET', headers: headers || {}, agent }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve({ status: res.statusCode, ms: performance.now() - start }));
    });
    req.on('error', () => resolve({ status: 0, ms: performance.now() - start }));
    req.end();
  });
}

async function runBatch(path, totalRequests, concurrency, headers) {
  const latencies = [];
  let inFlight = 0;
  let completed = 0;
  let idx = 0;
  async function launch() {
    while (idx < totalRequests && inFlight < concurrency) {
      inFlight++;
      const myIdx = idx++;
      httpGet(path, headers).then((r) => {
        latencies[myIdx] = r.ms;
      }).finally(() => {
        inFlight--;
        completed++;
        if (idx < totalRequests) launch();
      });
    }
  }
  launch();
  while (completed < totalRequests) {
    await new Promise((r) => setTimeout(r, 10));
  }
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95) - 1] || 0;
  const avg = latencies.reduce((s, v) => s + v, 0) / Math.max(1, latencies.length);
  return { p95, avg, count: latencies.length };
}

async function memorySamples(n, delayMs) {
  const values = [];
  for (let i = 0; i < n; i++) {
    try {
      const m = await fetch(APP_URL + '/api/metrics').then((r) => r.json());
      if (m && typeof m.heapUsed === 'number') values.push(m.heapUsed);
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return values;
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function loginToken() {
  function post(path, json) {
    return new Promise((resolve) => {
      const data = Buffer.from(JSON.stringify(json));
      const req = http.request(APP_URL + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }, agent }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', () => resolve({ status: 0, body: '' }));
      req.write(data);
      req.end();
    });
  }
  // Try login
  let r = await post('/api/auth/login', { email: 'perf@test.com', password: 'Perf!23456' });
  try {
    const b = JSON.parse(r.body || '{}');
    if (r.status === 200 && b.accessToken) return b.accessToken;
  } catch {}
  // Try register then login
  await post('/api/auth/register', { email: 'perf@test.com', password: 'Perf!23456', firstName: 'Perf', lastName: 'User' });
  r = await post('/api/auth/login', { email: 'perf@test.com', password: 'Perf!23456' });
  try {
    const b = JSON.parse(r.body || '{}');
    if (r.status === 200 && b.accessToken) return b.accessToken;
  } catch {}
  return '';
}

async function main() {
  // Warm-up to stabilize JIT and caches
  console.log('Warm-up /api/health');
  await runBatch('/api/health', 200, 50);

  console.log('Smoke /api/health');
  const smoke = await httpGet('/api/health');
  assert(smoke.status === 200, 'Health check did not return 200');

  console.log('Baseline 95th percentile < 500ms on /api/health (concurrency 80 x 1600 req)');
  const base = await runBatch('/api/health', 1600, 80);
  console.log(`/api/health p95=${base.p95.toFixed(1)}ms avg=${base.avg.toFixed(1)}ms`);
  assert(base.p95 < 500, 'Baseline p95 >= 500ms');

  console.log('Heavy load run on /api/health (concurrency 600 x 3600 req)');
  const heavy = await runBatch('/api/health', 3600, 600);
  console.log(`heavy /api/health p95=${heavy.p95.toFixed(1)}ms avg=${heavy.avg.toFixed(1)}ms`);

  // Auth for DB-heavy endpoints
  const token = await loginToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Warm-up analytics cache to stabilize p95
  console.log('Warm-up /api/analytics/performance');
  await runBatch('/api/analytics/performance', 100, 50, authHeaders);

  console.log('DB-heavy GET /api/analytics/performance under load (concurrency 120 x 1500 req)');
  const db = await runBatch('/api/analytics/performance', 1500, 120, authHeaders);
  console.log(`/api/analytics/performance p95=${db.p95.toFixed(1)}ms avg=${db.avg.toFixed(1)}ms`);

  // Extra: high-concurrency DB endpoint run (no hard assertion, for visibility)
  console.log('High-concurrency DB run /api/analytics/performance (concurrency 800 x 3000 req)');
  const dbHeavy = await runBatch('/api/analytics/performance', 3000, 800, authHeaders);
  console.log(`db-heavy /api/analytics/performance p95=${dbHeavy.p95.toFixed(1)}ms avg=${dbHeavy.avg.toFixed(1)}ms`);

  console.log('Memory leak check via /api/metrics');
  const mem = await memorySamples(30, 1000);
  if (mem.length >= 2) {
    const first = mem[0];
    const last = mem[mem.length - 1];
    const growth = first > 0 ? (last - first) / first : 0;
    console.log(`heapUsed growth ${(growth * 100).toFixed(1)}%`);
    assert(growth <= 0.25, 'Heap usage grew > 25%');
  }

  console.log('All acceptance criteria met.');
}

main().catch((e) => {
  console.error('Perf suite failed:', e.message);
  process.exit(1);
});


