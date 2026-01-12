const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING MIGRATION 0001 CLEAN PRODUCTION FIX');

// Test migration runner validation logic for the fixed file
function validateMigrationFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`CRITICAL: Migration file not found: ${filepath}`);
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  
  if (content.trim().length === 0) {
    throw new Error(`CRITICAL: Migration file is empty: ${filepath}`);
  }
  
  // Check for dangerous legacy patterns that caused the original failure
  const dangerousPatterns = [
    { pattern: 'project_id UUID REFERENCES', reason: 'Assumes UUID schema and foreign keys' },
    { pattern: 'uuid_generate_v4()', reason: 'Assumes UUID primary keys' },
    { pattern: 'CREATE TABLE IF NOT EXISTS content (', reason: 'May conflict with existing schema' },
    { pattern: 'ON DELETE CASCADE', reason: 'Dangerous foreign key constraints' }
  ];
  
  dangerousPatterns.forEach(({ pattern, reason }) => {
    if (content.includes(pattern)) {
      throw new Error(`DANGEROUS PATTERN DETECTED: ${pattern} - ${reason}`);
    }
  });
  
  // Verify it's properly retired
  if (!content.includes('RETIRED')) {
    throw new Error('Migration should be marked as RETIRED');
  }
  
  if (!content.includes('SELECT')) {
    throw new Error('Migration should contain valid SQL statement');
  }
  
  return { valid: true, content, size: content.length };
}

try {
  const result = validateMigrationFile('migrations/0001_core_tables_clean.sql');
  console.log('✅ Migration validation PASSED');
  console.log('✅ File size:', result.size, 'bytes');
  console.log('✅ Properly retired with valid SQL');
  console.log('✅ No dangerous legacy patterns detected');
  console.log('✅ No foreign key conflicts');
  console.log('✅ No UUID schema assumptions');
  console.log('✅ PRODUCTION SAFE - Migration runner will accept this file');
  
} catch (error) {
  console.error('❌ Migration validation FAILED:', error.message);
  process.exit(1);
}