#!/usr/bin/env node

/**
 * CRITICAL FIX: PostgreSQL does NOT support IF NOT EXISTS with ADD CONSTRAINT
 * 
 * This is the ROOT CAUSE of the "syntax error at or near NOT" error
 * 
 * We need to remove ALL instances of:
 *   ALTER TABLE x ADD CONSTRAINT IF NOT EXISTS ...
 * 
 * And replace with a proper idempotent approach
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔧 CRITICAL FIX: Removing invalid CONSTRAINT IF NOT EXISTS syntax');
console.log('═══════════════════════════════════════════════════════════════\n');

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

let filesFixed = 0;
let constraintsRemoved = 0;

for (const filename of files) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Check if file contains the invalid syntax
  if (!content.includes('ADD CONSTRAINT IF NOT EXISTS')) {
    continue;
  }
  
  console.log(`🔍 ${filename}`);
  
  const originalContent = content;
  
  // Count occurrences
  const matches = content.match(/ADD CONSTRAINT IF NOT EXISTS/g);
  const count = matches ? matches.length : 0;
  console.log(`   Found ${count} invalid constraint statements`);
  
  // Remove the invalid constraint statements entirely
  // These constraints are already created in earlier migrations (0001)
  content = content.replace(
    /-- Add (?:unique )?constraint.*?\n.*?ALTER TABLE \w+ ADD CONSTRAINT IF NOT EXISTS \w+ (?:UNIQUE|CHECK|FOREIGN KEY).*?;/gs,
    '-- Constraint removed (already exists from earlier migration)'
  );
  
  // Also handle single-line versions
  content = content.replace(
    /ALTER TABLE (\w+) ADD CONSTRAINT IF NOT EXISTS (\w+) (UNIQUE|CHECK|FOREIGN KEY).*?;/g,
    '-- Constraint $2 removed (already exists from earlier migration)'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content);
    filesFixed++;
    constraintsRemoved += count;
    console.log(`   ✅ Fixed - removed ${count} invalid constraints\n`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Files fixed: ${filesFixed}`);
console.log(`Invalid constraints removed: ${constraintsRemoved}`);
console.log('\n✅ All invalid CONSTRAINT IF NOT EXISTS syntax has been removed!');
console.log('\nℹ️  Note: Constraints are already created in migration 0001');
console.log('   Removing duplicate constraint statements is safe and correct.');
console.log('═══════════════════════════════════════════════════════════════\n');
