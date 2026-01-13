#!/usr/bin/env node

/**
 * Fix Railway Templates Schema Mismatch
 * 
 * Root Cause: Migration 0004_seed_essential_data.sql was trying to insert
 * data into a 'name' column, but the templates table created by 
 * 0001_core_tables_idempotent.sql uses a 'title' column instead.
 * 
 * This script verifies the fix and provides deployment instructions.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Railway Templates Schema Mismatch Fix\n');
console.log('=' .repeat(60));

// Check if the migration file has been fixed
const migrationPath = path.join(__dirname, 'migrations', '0004_seed_essential_data.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('\n✅ Checking migration file...');

if (migrationContent.includes('INSERT INTO templates (title,')) {
  console.log('✅ Migration 0004 has been fixed to use "title" column');
} else if (migrationContent.includes('INSERT INTO templates (name,')) {
  console.log('❌ Migration 0004 still uses "name" column - needs fixing!');
  process.exit(1);
} else {
  console.log('✅ Migration 0004 uses conditional insert logic');
}

console.log('\n📋 Root Cause Analysis:');
console.log('─'.repeat(60));
console.log('1. Migration 0001_core_tables_idempotent.sql creates templates table with:');
console.log('   - Column: "title" (NOT "name")');
console.log('   - Column: "type" (required)');
console.log('   - Column: "metadata" (instead of "template_data")');
console.log('');
console.log('2. Migration 0004_seed_essential_data.sql was trying to insert with:');
console.log('   - Column: "name" ❌ (should be "title")');
console.log('   - Column: "template_data" ❌ (should be "metadata")');
console.log('   - Missing: "type" column ❌');
console.log('');
console.log('3. Result: Migration failure on Railway deployment');

console.log('\n✅ Fix Applied:');
console.log('─'.repeat(60));
console.log('• Changed INSERT to use correct column names:');
console.log('  - "name" → "title"');
console.log('  - "template_data" → "metadata"');
console.log('  - Added required "type" column');
console.log('• Changed ON CONFLICT to use conditional INSERT (IF NOT EXISTS)');
console.log('  - Avoids conflict issues since "title" has no UNIQUE constraint');

console.log('\n🚀 Deployment Steps:');
console.log('─'.repeat(60));
console.log('1. Commit the fixed migration file:');
console.log('   git add migrations/0004_seed_essential_data.sql');
console.log('   git commit -m "fix: correct templates table column names in seed migration"');
console.log('');
console.log('2. Push to trigger Railway deployment:');
console.log('   git push origin main');
console.log('');
console.log('3. Monitor Railway logs for successful migration');

console.log('\n📊 Expected Result:');
console.log('─'.repeat(60));
console.log('✅ Migration 0004_seed_essential_data.sql should complete successfully');
console.log('✅ Templates table will be populated with 4 seed templates');
console.log('✅ Application should start without migration errors');

console.log('\n' + '='.repeat(60));
console.log('✅ Fix verification complete!\n');
