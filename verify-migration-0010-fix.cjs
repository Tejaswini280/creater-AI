#!/usr/bin/env node

/**
 * Verify Migration 0010 Fix
 * 
 * This script verifies that migration 0010 has been properly fixed
 * and no longer contains problematic DO blocks
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Migration 0010 Fix');
console.log('═══════════════════════════════════════════════════════════════\n');

const migrationPath = path.join(process.cwd(), 'migrations', '0010_railway_production_schema_repair_final.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const content = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file:', migrationPath);
console.log(`📏 File size: ${content.length} bytes\n`);

// Check for DO blocks
const hasDoBlocks = content.includes('DO $') || content.includes('DO $$');

if (hasDoBlocks) {
  console.error('❌ FAILED: Migration still contains DO blocks');
  console.error('   This will cause parsing errors on Railway PostgreSQL\n');
  process.exit(1);
}

console.log('✅ No DO blocks found');

// Check for required SQL statements
const checks = [
  { pattern: /ALTER TABLE users ADD COLUMN IF NOT EXISTS password/i, name: 'Add password column' },
  { pattern: /ALTER TABLE users ALTER COLUMN password DROP NOT NULL/i, name: 'Drop NOT NULL constraint' },
  { pattern: /ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE/i, name: 'Add email unique constraint' },
  { pattern: /UPDATE users[\s\S]*SET password = NULL/i, name: 'Clean up invalid passwords' },
];

console.log('\n🔍 Checking for required SQL statements:\n');

let allChecksPassed = true;

for (const check of checks) {
  const found = check.pattern.test(content);
  if (found) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} - NOT FOUND`);
    allChecksPassed = false;
  }
}

// Check for problematic patterns
console.log('\n🔍 Checking for problematic patterns:\n');

const problematicPatterns = [
  { pattern: /BEGIN\s*$/m, name: 'Incomplete BEGIN statement' },
  { pattern: /IF NOT EXISTS \(SELECT 1 FROM informat$/m, name: 'Truncated SQL' },
  { pattern: /\$\$\s*$/m, name: 'Incomplete DO block delimiter' },
];

let hasProblems = false;

for (const check of problematicPatterns) {
  const found = check.pattern.test(content);
  if (found) {
    console.log(`❌ ${check.name} - FOUND (this is bad)`);
    hasProblems = true;
  } else {
    console.log(`✅ ${check.name} - not found (good)`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');

if (allChecksPassed && !hasProblems) {
  console.log('✅ VERIFICATION PASSED');
  console.log('✅ Migration 0010 is properly fixed');
  console.log('✅ Safe to deploy to Railway');
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED');
  console.log('❌ Migration 0010 needs additional fixes');
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(1);
}
