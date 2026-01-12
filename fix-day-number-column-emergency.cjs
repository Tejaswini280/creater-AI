const fs = require('fs');

console.log('🚨 EMERGENCY FIX: Adding day_number column to migration');

const migrationPath = 'migrations/0001_core_tables_idempotent.sql';
let content = fs.readFileSync(migrationPath, 'utf8');

// Find the location after project_id fix and add day_number fix
const insertPoint = 'END $;\n\n-- Content Metrics table (NO FOREIGN KEYS)';
const dayNumberFix = `END $;

-- Add day_number column to content table (CRITICAL FIX)
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content' AND column_name = 'day_number'
    ) THEN
        ALTER TABLE content ADD COLUMN day_number INTEGER;
    END IF;
END $;

-- Content Metrics table (NO FOREIGN KEYS)`;

if (content.includes(insertPoint)) {
  content = content.replace(insertPoint, dayNumberFix);
  fs.writeFileSync(migrationPath, content, 'utf8');
  console.log('✅ Emergency fix applied - day_number column will be added');
} else {
  console.error('❌ Could not find insertion point');
  process.exit(1);
}