#!/usr/bin/env node

// Fallback start script for Railway
console.log('🚀 Starting application with fallback script...');

const { spawn } = require('child_process');
const fs = require('fs');

// Check if built files exist
if (fs.existsSync('dist/index.js')) {
  console.log('✅ Using built version');
  const child = spawn('node', ['dist/index.js'], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code));
} else {
  console.log('⚠️  Built version not found, using development mode');
  const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code));
}
