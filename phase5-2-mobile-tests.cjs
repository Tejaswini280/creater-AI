#!/usr/bin/env node
// Simple static checks to validate Phase 5 Task 5.2 acceptance criteria
// This does not run a browser; it verifies implementation signals in code.

const fs = require('fs');
const path = require('path');

function read(p) {
  return fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
}

function has(pattern, content) {
  return new RegExp(pattern, 'm').test(content);
}

const results = [];
function pass(name) { results.push({ test: name, status: 'PASSED' }); }
function fail(name, msg) { results.push({ test: name, status: 'FAILED', message: msg }); }

try {
  const indexHtml = read('client/index.html');
  // Viewport should allow zoom (no maximum-scale=1)
  if (/name="viewport"/i.test(indexHtml) && !/maximum-scale\s*=\s*1/.test(indexHtml)) {
    pass('Viewport allows zoom for accessibility');
  } else {
    fail('Viewport allows zoom for accessibility', 'maximum-scale=1 present or meta missing');
  }

  // Service worker registration present
  if (/serviceWorker/.test(indexHtml) || /serviceWorker/.test(read('client/src/main.tsx'))) {
    pass('Service Worker registration present');
  } else {
    fail('Service Worker registration present', 'No registration code found');
  }

  // SW file exists in public
  if (fs.existsSync(path.resolve(process.cwd(), 'client/public/sw.js'))) {
    pass('Offline SW present');
  } else {
    fail('Offline SW present', 'client/public/sw.js missing');
  }

  const dashboard = read('client/src/pages/dashboard.tsx');
  // Mobile drawer present
  if (has('<SheetContent[^>]*side=\"left\"', dashboard)) {
    pass('Mobile sidebar drawer implemented');
  } else {
    fail('Mobile sidebar drawer implemented', 'SheetContent side="left" not found');
  }
  // Mobile menu button
  if (has('<Menu', dashboard) && (has('setIsMobileSidebarOpen', dashboard) || has('aria-label=\"Open navigation\"', dashboard))) {
    pass('Mobile menu button implemented');
  } else {
    fail('Mobile menu button implemented', 'Button to open mobile nav not found');
  }
  // Swipe gesture handlers
  if (has('onTouchStart=', dashboard) && has('onTouchEnd=', dashboard)) {
    pass('Swipe gesture support implemented');
  } else {
    fail('Swipe gesture support implemented', 'Touch handlers not found');
  }

  const inputComp = read('client/src/components/ui/input.tsx');
  if (/touch-manipulation/.test(inputComp) || /touch-manipulation/.test(read('client/src/pages/dashboard.tsx'))) {
    pass('Touch interaction optimizations');
  } else {
    // This is not critical, but mark as failed for visibility
    fail('Touch interaction optimizations', 'No touch-manipulation class found');
  }

  // Basic responsive grid signals in dashboard
  if (/grid-cols-1\s+lg:grid-cols-3/.test(dashboard) && /lg:grid-cols-2/.test(dashboard)) {
    pass('Responsive grid breakpoints present');
  } else {
    fail('Responsive grid breakpoints present', 'Expected Tailwind breakpoints not found');
  }

  // Summarize
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.length - passed;
  const summary = { passed, failed, total: results.length, details: results };
  const outPath = path.resolve(process.cwd(), 'phase5-2-mobile-test-results.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Phase 5.2 Mobile Tests: ${passed}/${results.length} passed`);
  if (failed > 0) {
    console.table(results);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Test runner error:', err);
  process.exit(1);
}


