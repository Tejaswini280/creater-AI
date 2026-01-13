#!/usr/bin/env node

/**
 * Railway-Optimized Start Script
 * Handles various Railway deployment scenarios gracefully
 */

const { spawn } = require('child_process');
const fs = require('fs');

function startApplication() {
  console.log('🚀 Starting application for Railway...');
  
  // Check for built server file
  if (fs.existsSync('dist/index.js')) {
    console.log('✅ Using built server (dist/index.js)');
    const child = spawn('node', ['dist/index.js'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    child.on('error', (error) => {
      console.log('❌ Built server failed:', error.message);
      console.log('🔄 Falling back to npm start...');
      fallbackStart();
    });
    
    child.on('exit', (code) => {
      if (code !== 0) {
        console.log(`❌ Built server exited with code ${code}`);
        console.log('🔄 Falling back to npm start...');
        fallbackStart();
      } else {
        process.exit(code);
      }
    });
    
  } else {
    console.log('⚠️  Built server not found, using npm start');
    fallbackStart();
  }
}

function fallbackStart() {
  const child = spawn('npm', ['start'], { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  child.on('exit', (code) => process.exit(code));
}

if (require.main === module) {
  startApplication();
}
