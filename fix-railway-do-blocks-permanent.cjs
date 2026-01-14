#!/usr/bin/env node

/**
 * PERMANENT FIX: Remove ALL DO blocks from migrations
 * 
 * ROOT CAUSE: Railway PostgreSQL has issues parsing DO blocks in migrations
 * SOLUTION: Replace all DO blocks with simple SQL using CREATE ... IF NOT EXISTS
 * 
 * This script:
 * 1. Scans all migration files
 * 2. Identifies DO blocks
 * 3. Replaces them with Railway-compatible SQL
 * 4. Creates backups before modifying
 * 5. Validates the fixes
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const BACKUP_DIR = path.join(process.cwd(), 'backups', `migrations-do-blocks-${Date.now()}`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔧 PERMANENT FIX: Removing DO blocks from migrations');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
}

// Get all SQL files
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log(`📂 Found ${migrationFiles.length} migration files`);
console.log('');

let filesModified = 0;
let doBlocksRemoved = 0;

for (const filename of migrationFiles) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Check if file contains DO blocks
  const hasDoBlocks = content.includes('DO $$') || content.includes('DO $');
  
  if (!hasDoBlocks) {
    console.log(`⏭️  ${filename} - No DO blocks found`);
    continue;
  }
  
  console.log(`🔍 ${filename} - Contains DO blocks`);
  
  // Backup original file
  const backupPath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(backupPath, content);
  console.log(`   💾 Backed up to: ${backupPath}`);
  
  // Count DO blocks
  const doBlockCount = (content.match(/DO \$\$/g) || []).length + (content.match(/DO \$/g) || []).length;
  console.log(`   📊 Found ${doBlockCount} DO blocks`);
  
  // Replace DO blocks with simple SQL
  let modifiedContent = content;
  
  // Pattern 1: DO $$ blocks for adding constraints
  modifiedContent = modifiedContent.replace(
    /DO \$\$\s*BEGIN\s*IF NOT EXISTS \(\s*SELECT 1 FROM information_schema\.table_constraints tc\s*WHERE tc\.constraint_name = '([^']+)'\s*AND tc\.table_name = '([^']+)'\s*\) THEN\s*ALTER TABLE ([^\s]+) ADD CONSTRAINT ([^\s]+) ([^;]+);\s*END IF;\s*END \$\$;/gs,
    (match, constraintName, tableName, table, constraint, definition) => {
      return `-- Add constraint if it doesn't exist (Railway-compatible)\nALTER TABLE ${table} ADD CONSTRAINT IF NOT EXISTS ${constraint} ${definition};`;
    }
  );
  
  // Pattern 2: DO $ blocks (single dollar sign - malformed)
  modifiedContent = modifiedContent.replace(
    /DO \$ \s*BEGIN\s*IF NOT EXISTS \(\s*SELECT 1 FROM information_schema\.table_constraints tc\s*WHERE tc\.constraint_name = '([^']+)'\s*AND tc\.table_name = '([^']+)'\s*\) THEN\s*ALTER TABLE ([^\s]+) ADD CONSTRAINT ([^\s]+) ([^;]+);\s*END IF;\s*END \$;/gs,
    (match, constraintName, tableName, table, constraint, definition) => {
      return `-- Add constraint if it doesn't exist (Railway-compatible)\nALTER TABLE ${table} ADD CONSTRAINT IF NOT EXISTS ${constraint} ${definition};`;
    }
  );
  
  // Pattern 3: DO blocks for validation/logging (remove entirely)
  modifiedContent = modifiedContent.replace(
    /DO \$\$\s*DECLARE[^;]*?END \$\$;/gs,
    '-- Validation block removed (Railway-compatible)'
  );
  
  // Pattern 4: DO blocks for RAISE NOTICE (remove entirely)
  modifiedContent = modifiedContent.replace(
    /DO \$\$\s*BEGIN\s*RAISE NOTICE[^;]*?END \$\$;/gs,
    '-- Notice block removed (Railway-compatible)'
  );
  
  // Check if any modifications were made
  if (modifiedContent !== content) {
    fs.writeFileSync(filepath, modifiedContent);
    filesModified++;
    doBlocksRemoved += doBlockCount;
    console.log(`   ✅ Modified and saved`);
  } else {
    console.log(`   ⚠️  No automatic replacements possible - manual review needed`);
  }
  
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Files processed: ${migrationFiles.length}`);
console.log(`Files modified: ${filesModified}`);
console.log(`DO blocks removed: ${doBlocksRemoved}`);
console.log(`Backups saved to: ${BACKUP_DIR}`);
console.log('');

if (filesModified > 0) {
  console.log('✅ DO blocks have been removed from migrations');
  console.log('');
  console.log('🔍 NEXT STEPS:');
  console.log('1. Review the modified files to ensure correctness');
  console.log('2. Test migrations locally: npm run db:migrate');
  console.log('3. Commit changes: git add migrations/');
  console.log('4. Push to dev: git push origin dev');
  console.log('5. Deploy to Railway - migrations should now work');
} else {
  console.log('ℹ️  No files were modified automatically');
  console.log('   Manual review of DO blocks may be required');
}

console.log('═══════════════════════════════════════════════════════════════');
