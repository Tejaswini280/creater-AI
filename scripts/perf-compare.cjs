const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASELINE = path.join(__dirname, '..', 'perf-baseline.json');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString('utf8');
}

function parse(line) {
  const m = /p95=(\d+\.?\d*)ms avg=(\d+\.?\d*)ms/.exec(line);
  if (!m) return null;
  return { p95: Number(m[1]), avg: Number(m[2]) };
}

function main() {
  if (!fs.existsSync(BASELINE)) {
    console.error('No baseline found at', BASELINE);
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const out = run('npm run -s perf:accept');
  const lines = out.split(/\r?\n/);
  const current = {};
  for (const line of lines) {
    if (line.includes('/api/health p95=')) current.health = parse(line);
    if (line.includes('/api/analytics/performance p95=')) current.analytics = parse(line);
  }
  let ok = true;
  function compare(name) {
    if (!baseline[name] || !current[name]) return;
    const p95Grow = (current[name].p95 - baseline[name].p95) / Math.max(1, baseline[name].p95);
    console.log(`${name} p95 growth ${(p95Grow * 100).toFixed(1)}% (baseline ${baseline[name].p95}ms -> current ${current[name].p95}ms)`);
    if (p95Grow > 0.15) ok = false;
  }
  compare('health');
  compare('analytics');
  if (!ok) {
    console.error('Performance regression detected (>15% p95 increase)');
    process.exit(1);
  }
  console.log('No performance regression detected.');
}

main();


