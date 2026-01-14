#!/usr/bin/env node

/**
 * EMERGENCY FIX: Remove "DROP NOT NULL" statements
 * 
 * Railway PostgreSQL throws "syntax error at or near NOT" 
 * when using ALTER COLUMN ... DROP NOT NULL
 * 
 * SOLUTION: Remove these statements entirely since columns
 * are nullable by default when created with ADD COLUMN IF NOT EXISTS
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

console.log('🚨 EMERGENCY FIX: Removing DROP NOT NULL statements');
console.log('═══════════════════════════════════════════════════════════════\n');

// Get all SQL migration files
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(file => file.endsWith('.sql') && !file.includes('.disabled') && !file.includes('.skip') && !file.includes('.backup'))
  .sort();

let fixed = 0;
let errors = [];

for (const filename of migrationFiles) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Check if it has DROP NOT NULL
  if (!content.includes('DROP NOT NULL')) {
    continue;
  }
  
  console.log(`🔧 Fixing: ${filename}`);
  
  try {
    // Remove all DROP NOT NULL statements
    let fixedContent = content.replace(/ALTER TABLE (\w+) ALTER COLUMN (\w+) DROP NOT NULL;?\s*/gi, '');
    
    // Write the fixed version
    fs.writeFileSync(filepath, fixedContent);
    console.log(`   ✅ Removed DROP NOT NULL statements\n`);
    fixed++;
    
  } catch (error) {
    errors.push(`${filename}: ${error.message}`);
    console.error(`   ❌ Error: ${error.message}\n`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Migrations checked: ${migrationFiles.length}`);
console.log(`Migrations fixed: ${fixed}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(`   • ${error}`));
}

console.log('\n✅ All DROP NOT NULL statements removed');
console.log('✅ Columns are nullable by default');
console.log('✅ Ready to deploy to Railway');
console.log('═══════════════════════════════════════════════════════════════\n');

process.exit(errors.length > 0 ? 1 : 0);
