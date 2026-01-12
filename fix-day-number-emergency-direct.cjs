const fs = require('fs');

console.log('🚨 EMERGENCY FIX: Adding day_number column to migration');

const migrationPath = 'migrations/0001_core_tables_idempotent.sql';
let content = fs.readFileSync(migrationPath, 'utf8');

// Add the day_number column fix right after the project_id fix
const searchText = 'ALTER TABLE content ADD COLUMN project_id INTEGER;';
const insertAfter = `ALTER TABLE content ADD COLUMN project_id INTEGER;
    END IF;
END $;

-- Add day_number column to content table (CRITICAL FIX)
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content' AND column_name = 'day_number'
    ) THEN
        ALTER TABLE content ADD COLUMN day_number INTEGER;`;

if (content.includes(searchText)) {
  content = content.replace(searchText, insertAfter);
  fs.writeFileSync(migrationPath, content, 'utf8');
  console.log('✅ Emergency fix applied - day_number column will be added');
} else {
  console.error('❌ Could not find project_id insertion point');
  console.log('Searching for alternative...');
  
  // Alternative approach - add before Content Metrics table
  const altSearch = '-- Content Metrics table (NO FOREIGN KEYS)';
  const altInsert = `-- Add day_number column to content table (CRITICAL FIX)
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
  
  if (content.includes(altSearch)) {
    content = content.replace(altSearch, altInsert);
    fs.writeFileSync(migrationPath, content, 'utf8');
    console.log('✅ Alternative fix applied - day_number column will be added');
  } else {
    console.error('❌ Could not find any insertion point');
    process.exit(1);
  }
}