const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, '..', 'perf-baseline.json');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString('utf8');
}

function parse(line) {
  const m = /p95=(\d+\.?\d*)ms avg=(\d+\.?\d*)ms/.exec(line);
  if (!m) return null;
  return { p95: Number(m[1]), avg: Number(m[2]) };
}

function main() {
  const out = run('npm run -s perf:accept');
  const lines = out.split(/\r?\n/);
  const metrics = {};
  for (const line of lines) {
    if (line.includes('/api/health p95=')) metrics.health = parse(line);
    if (line.includes('/api/analytics/performance p95=')) metrics.analytics = parse(line);
  }
  fs.writeFileSync(OUT, JSON.stringify(metrics, null, 2));
  console.log('Saved baseline to', OUT);
}

main();


