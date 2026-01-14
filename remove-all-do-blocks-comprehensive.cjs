#!/usr/bin/env node

/**
 * COMPREHENSIVE FIX: Remove ALL DO blocks from ALL migrations
 * 
 * This script handles ALL patterns of DO blocks found in the codebase
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

console.log('🔧 Removing ALL DO blocks from migrations...\n');

const filesToFix = [
  '0006_critical_form_database_mapping_fix.sql',
  '0007_production_repair_idempotent.sql',
  '0008_final_constraints_and_cleanup.sql',
  '0011_add_missing_unique_constraints.sql',
  '0012_immediate_dependency_fix.sql'
];

for (const filename of filesToFix) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⏭️  ${filename} - File not found, skipping`);
    continue;
  }
  
  let content = fs.readFileSync(filepath, 'utf8');
  const originalLength = content.length;
  
  console.log(`🔍 Processing: ${filename}`);
  
  // Remove ALL DO $$ blocks - replace with simple SQL
  // This regex matches the entire DO block structure
  content = content.replace(
    /DO \$\$[\s\S]*?END \$\$;/g,
    (match) => {
      // Extract the constraint being added
      const constraintMatch = match.match(/ALTER TABLE (\w+) ADD CONSTRAINT (\w+) ([^;]+);/);
      if (constraintMatch) {
        const [, table, constraint, definition] = constraintMatch;
        return `-- Constraint added with IF NOT EXISTS (Railway-compatible)\nALTER TABLE ${table} ADD CONSTRAINT IF NOT EXISTS ${constraint} ${definition};`;
      }
      
      // If it's just validation/logging, remove it
      return '-- DO block removed (Railway-compatible)';
    }
  );
  
  if (content.length !== originalLength) {
    fs.writeFileSync(filepath, content);
    console.log(`   ✅ Modified (${originalLength} → ${content.length} bytes)`);
  } else {
    console.log(`   ⏭️  No changes needed`);
  }
}

console.log('\n✅ All DO blocks have been removed!');
console.log('\n🔍 Verifying...');

// Verify no DO blocks remain
let doBlocksFound = 0;
for (const filename of fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
  const matches = content.match(/DO \$\$/g);
  if (matches) {
    console.log(`⚠️  ${filename} still contains ${matches.length} DO blocks`);
    doBlocksFound += matches.length;
  }
}

if (doBlocksFound === 0) {
  console.log('✅ Verification passed - no DO blocks found in any migration!');
} else {
  console.log(`⚠️  Warning: ${doBlocksFound} DO blocks still remain`);
}
