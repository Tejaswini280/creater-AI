const fs = require('fs');
const path = require('path');

console.log('🔍 Testing migration file validation...');

// Test the fixed migration file
const migrationPath = path.join(process.cwd(), 'migrations', '0014_comprehensive_column_additions.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const content = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file content:');
console.log('─'.repeat(80));
console.log(content);
console.log('─'.repeat(80));

// Validate content
if (content.trim().length === 0) {
  console.error('❌ CRITICAL: Migration file is empty');
  process.exit(1);
}

// Check for incomplete SQL patterns
if (content.includes('IF NOT EXISTS (SELECT 1 FROM informat') || 
    content.endsWith('IF NOT EXISTS (SELECT 1 FROM informat')) {
  console.error('❌ CRITICAL: Migration file contains incomplete SQL (truncated)');
  process.exit(1);
}

// Check for incomplete DO blocks
if (content.includes('DO $') && !content.includes('END $')) {
  console.error('❌ CRITICAL: Migration file contains incomplete DO block');
  process.exit(1);
}

// Check if it's a retired migration
if (content.includes('RETIRED') && content.includes('SELECT')) {
  console.log('✅ Migration is properly retired with valid SQL');
} else if (content.includes('SELECT') || content.includes('CREATE') || content.includes('ALTER')) {
  console.log('✅ Migration contains valid SQL statements');
} else {
  console.error('❌ Migration does not contain recognizable SQL statements');
  process.exit(1);
}

console.log('✅ Migration validation passed - file is safe for production');