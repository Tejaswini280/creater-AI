const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING PRODUCTION MIGRATION FIX');

// Test migration runner validation logic
function validateMigrationFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`CRITICAL: Migration file not found: ${filepath}`);
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  
  if (content.trim().length === 0) {
    throw new Error(`CRITICAL: Migration file is empty: ${filepath}`);
  }
  
  // Check for incomplete SQL patterns
  if (content.includes('IF NOT EXISTS (SELECT 1 FROM informat') || 
      content.endsWith('IF NOT EXISTS (SELECT 1 FROM informat')) {
    throw new Error(`CRITICAL: Migration file contains incomplete SQL (truncated): ${filepath}`);
  }
  
  // Check for incomplete DO blocks
  if (content.includes('DO $') && !content.includes('END $')) {
    throw new Error(`CRITICAL: Migration file contains incomplete DO block: ${filepath}`);
  }
  
  return { valid: true, content, size: content.length };
}

try {
  const result = validateMigrationFile('migrations/0014_comprehensive_column_additions.sql');
  console.log('✅ Migration validation PASSED');
  console.log('✅ File size:', result.size, 'bytes');
  console.log('✅ Contains SELECT statement:', result.content.includes('SELECT'));
  console.log('✅ No incomplete SQL detected');
  console.log('✅ PRODUCTION SAFE - Migration runner will accept this file');
  
} catch (error) {
  console.error('❌ Migration validation FAILED:', error.message);
  process.exit(1);
}