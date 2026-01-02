const autocannon = require('autocannon');
const http = require('http');

const APP_URL = process.env.APP_URL || 'http://localhost:5000';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(APP_URL + path, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
  });
}

async function smoke() {
  const health = await get('/api/health');
  if (health.status !== 200) throw new Error('Health check failed: ' + health.status);
  const metrics = await get('/api/metrics');
  if (metrics.status !== 200) throw new Error('Metrics failed: ' + metrics.status);
}

function runA11y(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const inst = autocannon({ url, ...opts }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    autocannon.track(inst, { renderProgressBar: false, renderResultsTable: false });
  });
}

function assertP95(name, res, limitMs = 500) {
  const p95 = res.latency.p95;
  console.log(`${name} p95: ${p95} ms`);
  if (p95 > limitMs) throw new Error(`${name} p95 above ${limitMs}ms`);
}

async function main() {
  console.log('Baseline smoke...');
  await smoke();

  const common = { connections: 50, pipelining: 1, duration: 20 };

  console.log('Load: GET /api/health');
  const r1 = await runA11y(APP_URL + '/api/health', { method: 'GET', ...common });
  assertP95('health', r1);

  console.log('Load: GET /api/metrics');
  const r2 = await runA11y(APP_URL + '/api/metrics', { method: 'GET', ...common });
  assertP95('metrics', r2);

  console.log('Load: GET /api/content (unauth)');
  const r3 = await runA11y(APP_URL + '/api/content', { method: 'GET', ...common });
  assertP95('content(unauth)', r3);

  console.log('DB-heavy: GET /api/analytics/performance (unauth)');
  const r4 = await runA11y(APP_URL + '/api/analytics/performance', { method: 'GET', ...common });
  assertP95('analytics/performance', r4);

  console.log('Memory check (metrics sampling)');
  const samples = [];
  for (let i = 0; i < 10; i++) {
    const m = await get('/api/metrics');
    try {
      const json = JSON.parse(m.body);
      if (json.heapUsed) samples.push(json.heapUsed);
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  if (samples.length >= 2) {
    const first = samples[0];
    const last = samples[samples.length - 1];
    const increase = last - first;
    if (first > 0 && increase > first * 0.25) {
      throw new Error('Heap usage grew >25% during short run');
    }
  }

  console.log('All performance benchmarks within thresholds.');
}

main().catch((e) => {
  console.error('Performance test failed:', e.message);
  process.exit(1);
});


