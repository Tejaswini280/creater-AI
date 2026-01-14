#!/usr/bin/env node

/**
 * ROOT CAUSE DIAGNOSIS: Script Column Missing
 * 
 * This diagnostic script performs a comprehensive audit to determine
 * why the script column is missing despite migrations claiming to create it.
 */

const postgres = require('postgres');

async function diagnoseRootCause() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ROOT CAUSE DIAGNOSIS: Script Column Missing');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT 1: Check which migrations have been executed
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 AUDIT 1: Migration Execution History\n');
    
    const migrationHistory = await sql`
      SELECT filename, executed_at, execution_time_ms
      FROM schema_migrations
      WHERE filename LIKE '%0012%' OR filename LIKE '%0027%'
      ORDER BY executed_at DESC
    `;
    
    console.log('Migrations that should have created script column:');
    if (migrationHistory.length === 0) {
      console.log('❌ CRITICAL: No relevant migrations found in schema_migrations table!');
      console.log('   This means migration 0012 never ran or was not tracked.\n');
    } else {
      migrationHistory.forEach(m => {
        console.log(`   ✓ ${m.filename}`);
        console.log(`     Executed: ${m.executed_at}`);
        console.log(`     Duration: ${m.execution_time_ms}ms\n`);
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT 2: Check actual content table schema
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 AUDIT 2: Actual Content Table Schema\n');
    
    const actualColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
      ORDER BY ordinal_position
    `;
    
    console.log(`Content table has ${actualColumns.length} columns:`);
    
    const hasScript = actualColumns.some(col => col.column_name === 'script');
    
    actualColumns.forEach(col => {
      const marker = col.column_name === 'script' ? '✓ ' : '  ';
      console.log(`${marker}${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('');
    
    if (!hasScript) {
      console.log('❌ CONFIRMED: script column is MISSING from content table\n');
    } else {
      console.log('✅ script column EXISTS in content table\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT 3: Check what the scheduler verification actually checks
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 AUDIT 3: Scheduler Verification Logic Flaw\n');
    
    const schedulerChecks = ['id', 'status', 'scheduled_at', 'user_id'];
    const schedulerCheckResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name = ANY(${schedulerChecks})
    `;
    
    console.log('Columns checked by scheduler verification:');
    schedulerChecks.forEach(col => {
      const exists = schedulerCheckResult.some(r => r.column_name === col);
      console.log(`   ${exists ? '✓' : '✗'} ${col}`);
    });
    
    console.log('\n❌ FATAL FLAW: Scheduler verification checks 4 columns');
    console.log('   but NEVER checks for "script" column that code actually uses!\n');
    
    console.log('Columns actually used by scheduler code:');
    const usedColumns = ['id', 'user_id', 'title', 'description', 'script', 'platform', 
                         'status', 'scheduled_at', 'created_at', 'updated_at', 'metadata'];
    
    for (const col of usedColumns) {
      const exists = actualColumns.some(c => c.column_name === col);
      console.log(`   ${exists ? '✓' : '✗'} ${col}`);
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT 4: Check all migrations that reference content table
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 AUDIT 4: All Executed Migrations\n');
    
    const allMigrations = await sql`
      SELECT filename, executed_at
      FROM schema_migrations
      ORDER BY executed_at ASC
    `;
    
    console.log(`Total migrations executed: ${allMigrations.length}\n`);
    
    const contentTableMigrations = allMigrations.filter(m => 
      m.filename.includes('0007') || 
      m.filename.includes('0009') || 
      m.filename.includes('0012') ||
      m.filename.includes('0027')
    );
    
    if (contentTableMigrations.length > 0) {
      console.log('Migrations that should have created content table with script:');
      contentTableMigrations.forEach(m => {
        console.log(`   ${m.filename} - ${m.executed_at}`);
      });
    } else {
      console.log('❌ CRITICAL: No content table migrations found in history!');
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════════
    // ROOT CAUSE SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ROOT CAUSE ANALYSIS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('🔍 FINDINGS:\n');
    
    console.log('1. SCHEMA VERIFICATION FLAW:');
    console.log('   ❌ Scheduler checks only 4 columns: id, status, scheduled_at, user_id');
    console.log('   ❌ Scheduler NEVER checks for "script" column');
    console.log('   ❌ Verification passes even when script column is missing');
    console.log('   ❌ Misleading log: "Database schema verified for scheduler"\n');
    
    console.log('2. MIGRATION EXECUTION:');
    if (migrationHistory.length === 0) {
      console.log('   ❌ Migration 0012 did NOT run or was not tracked');
      console.log('   ❌ Migration 0027 (fix) has not run yet');
    } else {
      console.log('   ✓ Some migrations executed');
    }
    console.log('');
    
    console.log('3. ACTUAL DATABASE STATE:');
    if (!hasScript) {
      console.log('   ❌ script column is MISSING from content table');
      console.log('   ❌ Scheduler will fail when accessing item.script');
    } else {
      console.log('   ✓ script column exists');
    }
    console.log('');
    
    console.log('4. ERROR MASKING:');
    console.log('   ❌ Error is caught and logged as "expected"');
    console.log('   ❌ Scheduler continues to start despite missing column');
    console.log('   ❌ Polling loop repeatedly fails with same error\n');
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PERMANENT FIX REQUIRED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('Required Actions:\n');
    console.log('1. Add script column with idempotent migration (0027)');
    console.log('2. Fix schema verification to check ALL required columns');
    console.log('3. Prevent scheduler from starting if schema is incomplete');
    console.log('4. Remove misleading "expected" error messages');
    console.log('5. Add comprehensive schema validation before any queries\n');

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run diagnosis
diagnoseRootCause().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
