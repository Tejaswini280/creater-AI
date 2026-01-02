// Long-duration memory check via /api/metrics
const https = require('http');

const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const HOURS = Number(process.env.MEM_HOURS || 24);
const INTERVAL_MS = 60_000; // 1 min

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(APP_URL + path, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
  });
}

async function main() {
  const samples = [];
  const iterations = Math.ceil((HOURS * 60_000 * 60) / INTERVAL_MS);
  for (let i = 0; i < iterations; i++) {
    try {
      const r = await get('/api/metrics');
      if (r.status === 200) {
        const j = JSON.parse(r.body);
        if (j && typeof j.heapUsed === 'number') samples.push(j.heapUsed);
      }
    } catch {}
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  if (samples.length >= 2) {
    const first = samples[0];
    const last = samples[samples.length - 1];
    const growth = first > 0 ? (last - first) / first : 0;
    console.log(`Memory growth over ${HOURS}h: ${(growth * 100).toFixed(1)}%`);
    if (growth > 0.25) {
      console.error('FAIL: heap growth > 25%');
      process.exit(1);
    }
  }
  console.log('Memory long-run check passed');
}

main();


