#!/usr/bin/env node

/**
 * Quick Migration Fix
 * Run migrations with the simple, reliable runner
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running migrations with fixed runner...');

const runner = spawn('node', ['simple-migration-runner.mjs'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

runner.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Migrations completed successfully');
    
    // Now run seeding
    console.log('🌱 Starting database seeding...');
    const seeder = spawn('node', ['scripts/seed-database.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    seeder.on('close', (seedCode) => {
      if (seedCode === 0) {
        console.log('🎉 Database setup completed successfully!');
      } else {
        console.error('❌ Seeding failed');
        process.exit(1);
      }
    });
    
  } else {
    console.error('❌ Migration failed');
    process.exit(1);
  }
});
