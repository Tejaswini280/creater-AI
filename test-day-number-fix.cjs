const fs = require('fs');

console.log('🧪 TESTING DAY_NUMBER COLUMN FIX');

const migrationPath = 'migrations/0001_core_tables_idempotent.sql';
const content = fs.readFileSync(migrationPath, 'utf8');

// Check if day_number column fix is present
if (content.includes('day_number column to content table')) {
  console.log('✅ Day_number column fix found in migration');
} else {
  console.error('❌ Day_number column fix NOT found');
  process.exit(1);
}

// Check if the index creation is still there
if (content.includes('idx_content_day_number')) {
  console.log('✅ Day_number index creation found');
} else {
  console.error('❌ Day_number index creation NOT found');
  process.exit(1);
}

// Check for proper SQL syntax
if (content.includes('ALTER TABLE content ADD COLUMN day_number INTEGER')) {
  console.log('✅ Proper ALTER TABLE statement found');
} else {
  console.error('❌ ALTER TABLE statement NOT found');
  process.exit(1);
}

console.log('✅ ALL CHECKS PASSED - Migration should work now');
console.log('🚀 Ready to restart application');