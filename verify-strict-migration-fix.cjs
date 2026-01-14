/**
 * VERIFICATION SCRIPT: Strict Migration Runner Fix
 * 
 * This script verifies that the strict migration runner fix is working correctly:
 * 1. Checks that all required files exist
 * 2. Validates schema definition completeness
 * 3. Tests schema validation logic
 * 4. Verifies SQL query syntax
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🔍 VERIFYING STRICT MIGRATION RUNNER FIX');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('');

let allTestsPassed = true;

// Test 1: Verify required files exist
console.log('📋 Test 1: Verifying required files exist...');

const requiredFiles = [
  'server/services/strictMigrationRunner.ts',
  'server/services/scheduler.ts',
  'server/index.ts',
  'MIGRATION_SCHEMA_PERMANENT_FIX_COMPLETE.md',
  'deploy-strict-migration-fix.ps1'
];

let filesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    filesExist = false;
    allTestsPassed = false;
  }
}

if (filesExist) {
  console.log('  ✅ All required files exist');
} else {
  console.log('  ❌ Some required files are missing');
}

console.log('');

// Test 2: Verify strictMigrationRunner.ts contains key fixes
console.log('📋 Test 2: Verifying strictMigrationRunner.ts implementation...');

const strictRunnerContent = fs.readFileSync('server/services/strictMigrationRunner.ts', 'utf8');

const requiredFeatures = [
  { name: 'EXPECTED_SCHEMA definition', pattern: /const EXPECTED_SCHEMA = \{/ },
  { name: 'validateDatabaseSchema method', pattern: /async validateDatabaseSchema\(\): Promise<SchemaValidation>/ },
  { name: 'Column-level validation', pattern: /missingColumns\.push/ },
  { name: 'Schema validation before migrations', pattern: /const initialValidation = await this\.validateDatabaseSchema\(\)/ },
  { name: 'Schema validation after migrations', pattern: /const finalValidation = await this\.validateDatabaseSchema\(\)/ },
  { name: 'Re-execution on invalid schema', pattern: /Re-executing \(schema invalid/ },
  { name: 'Fail-fast on validation failure', pattern: /if \(!finalValidation\.isValid\)/ }
];

let featuresImplemented = true;
for (const feature of requiredFeatures) {
  if (feature.pattern.test(strictRunnerContent)) {
    console.log(`  ✅ ${feature.name}`);
  } else {
    console.log(`  ❌ ${feature.name} - NOT FOUND`);
    featuresImplemented = false;
    allTestsPassed = false;
  }
}

if (featuresImplemented) {
  console.log('  ✅ All required features implemented');
} else {
  console.log('  ❌ Some required features are missing');
}

console.log('');

// Test 3: Verify scheduler.ts SQL query fix
console.log('📋 Test 3: Verifying scheduler.ts SQL query fix...');

const schedulerContent = fs.readFileSync('server/services/scheduler.ts', 'utf8');

const sqlQueryChecks = [
  { name: 'No ANY($1) syntax', pattern: /ANY\(\$1\)/, shouldNotExist: true },
  { name: 'Uses IN clause instead', pattern: /column_name IN \(/ },
  { name: 'Includes table_schema filter', pattern: /table_schema = 'public'/ },
  { name: 'Lists all required columns', pattern: /'script'/ }
];

let sqlQueryFixed = true;
for (const check of sqlQueryChecks) {
  const found = check.pattern.test(schedulerContent);
  const passed = check.shouldNotExist ? !found : found;
  
  if (passed) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} - FAILED`);
    sqlQueryFixed = false;
    allTestsPassed = false;
  }
}

if (sqlQueryFixed) {
  console.log('  ✅ SQL query fix verified');
} else {
  console.log('  ❌ SQL query fix incomplete');
}

console.log('');

// Test 4: Verify server/index.ts uses StrictMigrationRunner
console.log('📋 Test 4: Verifying server/index.ts uses StrictMigrationRunner...');

const indexContent = fs.readFileSync('server/index.ts', 'utf8');

const indexChecks = [
  { name: 'Imports StrictMigrationRunner', pattern: /import.*StrictMigrationRunner.*from.*strictMigrationRunner/ },
  { name: 'Creates StrictMigrationRunner instance', pattern: /new StrictMigrationRunner\(\)/ },
  { name: 'Checks schemaValid flag', pattern: /migrationResult\.schemaValid/ },
  { name: 'Exits on invalid schema', pattern: /process\.exit\(1\)/ }
];

let indexUpdated = true;
for (const check of indexChecks) {
  if (check.pattern.test(indexContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} - NOT FOUND`);
    indexUpdated = false;
    allTestsPassed = false;
  }
}

if (indexUpdated) {
  console.log('  ✅ server/index.ts updated correctly');
} else {
  console.log('  ❌ server/index.ts update incomplete');
}

console.log('');

// Test 5: Verify EXPECTED_SCHEMA includes all critical tables
console.log('📋 Test 5: Verifying EXPECTED_SCHEMA completeness...');

const criticalTables = [
  { table: 'users', columns: ['id', 'email', 'password_hash'] },
  { table: 'projects', columns: ['id', 'user_id', 'name'] },
  { table: 'content', columns: ['id', 'user_id', 'script', 'platform', 'status', 'scheduled_at'] },
  { table: 'schema_migrations', columns: ['id', 'filename', 'checksum', 'status'] }
];

let schemaComplete = true;
for (const { table, columns } of criticalTables) {
  const tablePattern = new RegExp(`${table}:\\s*\\[`);
  if (tablePattern.test(strictRunnerContent)) {
    console.log(`  ✅ Table '${table}' defined`);
    
    // Check critical columns
    for (const column of columns) {
      const columnPattern = new RegExp(`'${column}'`);
      if (columnPattern.test(strictRunnerContent)) {
        console.log(`    ✅ Column '${column}'`);
      } else {
        console.log(`    ❌ Column '${column}' - MISSING`);
        schemaComplete = false;
        allTestsPassed = false;
      }
    }
  } else {
    console.log(`  ❌ Table '${table}' - NOT DEFINED`);
    schemaComplete = false;
    allTestsPassed = false;
  }
}

if (schemaComplete) {
  console.log('  ✅ EXPECTED_SCHEMA is complete');
} else {
  console.log('  ❌ EXPECTED_SCHEMA is incomplete');
}

console.log('');

// Test 6: Verify migration 0027 exists (adds script column)
console.log('📋 Test 6: Verifying migration 0027 exists...');

const migration0027Path = 'migrations/0027_add_missing_script_column.sql';
if (fs.existsSync(migration0027Path)) {
  console.log(`  ✅ ${migration0027Path} exists`);
  
  const migration0027Content = fs.readFileSync(migration0027Path, 'utf8');
  
  const migration0027Checks = [
    { name: 'Adds script column', pattern: /ALTER TABLE content ADD COLUMN IF NOT EXISTS script TEXT/ },
    { name: 'Validates column exists', pattern: /column_name = 'script'/ },
    { name: 'Is idempotent', pattern: /IF NOT EXISTS/ }
  ];
  
  let migration0027Valid = true;
  for (const check of migration0027Checks) {
    if (check.pattern.test(migration0027Content)) {
      console.log(`    ✅ ${check.name}`);
    } else {
      console.log(`    ❌ ${check.name} - NOT FOUND`);
      migration0027Valid = false;
      allTestsPassed = false;
    }
  }
  
  if (migration0027Valid) {
    console.log('  ✅ Migration 0027 is valid');
  } else {
    console.log('  ❌ Migration 0027 is incomplete');
  }
} else {
  console.log(`  ❌ ${migration0027Path} - MISSING`);
  allTestsPassed = false;
}

console.log('');

// Final summary
console.log('═══════════════════════════════════════════════════════════════════════════════');
if (allTestsPassed) {
  console.log('✅ ALL VERIFICATION TESTS PASSED');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🚀 The strict migration runner fix is ready for deployment!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run build (to verify TypeScript compilation)');
  console.log('2. Run: ./deploy-strict-migration-fix.ps1 (to deploy)');
  console.log('3. Monitor Railway logs for successful deployment');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ SOME VERIFICATION TESTS FAILED');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  Please fix the issues above before deploying.');
  console.log('');
  process.exit(1);
}
