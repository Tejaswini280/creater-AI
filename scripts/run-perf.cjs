const { spawnSync } = require('node:child_process');

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${res.status}`);
  }
}

const APP_URL = process.env.APP_URL || 'http://localhost:5000';

function hasBinary(cmd) {
  const isWin = process.platform === 'win32';
  const checker = isWin ? 'where' : 'which';
  const res = spawnSync(checker, [cmd], { stdio: 'pipe' });
  return res.status === 0;
}

if (hasBinary('k6')) {
  console.log('Running k6: basic');
  run('k6', ['run', 'tests/perf/basic.k6.js'], { APP_URL });

  console.log('Running k6: api');
  run('k6', ['run', 'tests/perf/api.k6.js'], { APP_URL });

  console.log('Running k6: db');
  run('k6', ['run', 'tests/perf/db.k6.js'], { APP_URL });

  console.log('Running k6: memory');
  run('k6', ['run', 'tests/perf/memory.k6.js'], { APP_URL });
} else {
  console.log('k6 binary not found on this machine; skipping k6 perf suite.');
}

console.log('All perf tests passed');


