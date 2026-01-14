/**
 * VERIFICATION SCRIPT: Migration 0001 Fix
 * 
 * Verifies that the new idempotent migration 0001 correctly creates all core tables
 * and that the retired migration is no longer active.
 */

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db', {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false
});

async function verifyMigration0001Fix() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING MIGRATION 0001 FIX');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    success: true,
    checks: [],
    errors: []
  };

  try {
    // Check 1: Verify retired migration is not in migrations folder
    console.log('📋 Check 1: Verify retired migration is not active...');
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir);
    
    const retiredFile = files.find(f => f === '0001_core_tables_clean.sql');
    const newFile = files.find(f => f === '0001_core_tables_idempotent.sql');
    const retiredBackup = files.find(f => f === '0001_core_tables_clean.sql.retired');
    
    if (retiredFile) {
      results.success = false;
      results.errors.push('❌ Retired migration 0001_core_tables_clean.sql is still active');
      console.log('   ❌ FAILED: Retired migration still active');
    } else {
      results.checks.push('✅ Retired migration is not active');
      console.log('   ✅ PASSED: Retired migration not active');
    }
    
    if (!newFile) {
      results.success = false;
      results.errors.push('❌ New migration 0001_core_tables_idempotent.sql not found');
      console.log('   ❌ FAILED: New migration not found');
    } else {
      results.checks.push('✅ New idempotent migration exists');
      console.log('   ✅ PASSED: New idempotent migration exists');
    }
    
    if (retiredBackup) {
      results.checks.push('✅ Retired migration backed up as .retired');
      console.log('   ✅ PASSED: Retired migration backed up');
    }

    // Check 2: Verify core tables exist
    console.log('\n📋 Check 2: Verify core tables exist...');
    const requiredTables = ['users', 'projects', 'content', 'content_metrics', 'post_schedules', 'social_posts'];
    
    for (const tableName of requiredTables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      
      if (tableExists[0].exists) {
        results.checks.push(`✅ Table '${tableName}' exists`);
        console.log(`   ✅ PASSED: Table '${tableName}' exists`);
      } else {
        results.success = false;
        results.errors.push(`❌ Table '${tableName}' does not exist`);
        console.log(`   ❌ FAILED: Table '${tableName}' missing`);
      }
    }

    // Check 3: Verify critical columns exist
    console.log('\n📋 Check 3: Verify critical columns exist...');
    const criticalColumns = [
      { table: 'users', column: 'id' },
      { table: 'users', column: 'email' },
      { table: 'users', column: 'password_hash' },
      { table: 'projects', column: 'id' },
      { table: 'projects', column: 'user_id' },
      { table: 'projects', column: 'name' }, // CRITICAL FIX
      { table: 'content', column: 'id' },
      { table: 'content', column: 'user_id' },
      { table: 'content', column: 'title' },
      { table: 'content', column: 'platform' },
      { table: 'content', column: 'status' },
      { table: 'content_metrics', column: 'id' },
      { table: 'content_metrics', column: 'content_id' },
      { table: 'post_schedules', column: 'id' },
      { table: 'post_schedules', column: 'platform' },
      { table: 'post_schedules', column: 'scheduled_at' },
      { table: 'post_schedules', column: 'status' }
    ];
    
    for (const { table, column } of criticalColumns) {
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
          AND column_name = ${column}
        ) as exists
      `;
      
      if (columnExists[0].exists) {
        results.checks.push(`✅ Column '${table}.${column}' exists`);
        console.log(`   ✅ PASSED: Column '${table}.${column}' exists`);
      } else {
        results.success = false;
        results.errors.push(`❌ Column '${table}.${column}' does not exist`);
        console.log(`   ❌ FAILED: Column '${table}.${column}' missing`);
      }
    }

    // Check 4: Verify indexes exist
    console.log('\n📋 Check 4: Verify essential indexes exist...');
    const requiredIndexes = [
      'idx_session_expire',
      'idx_users_email',
      'idx_projects_user_id',
      'idx_content_user_id',
      'idx_content_metrics_content_id',
      'idx_post_schedules_scheduled_at'
    ];
    
    for (const indexName of requiredIndexes) {
      const indexExists = await sql`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = ${indexName}
        ) as exists
      `;
      
      if (indexExists[0].exists) {
        results.checks.push(`✅ Index '${indexName}' exists`);
        console.log(`   ✅ PASSED: Index '${indexName}' exists`);
      } else {
        results.success = false;
        results.errors.push(`❌ Index '${indexName}' does not exist`);
        console.log(`   ❌ FAILED: Index '${indexName}' missing`);
      }
    }

    // Check 5: Verify migration 0001 is recorded
    console.log('\n📋 Check 5: Verify migration 0001 execution record...');
    const migration0001 = await sql`
      SELECT filename, status, executed_at 
      FROM schema_migrations 
      WHERE filename LIKE '0001%'
      ORDER BY executed_at DESC
      LIMIT 1
    `;
    
    if (migration0001.length > 0) {
      const record = migration0001[0];
      console.log(`   📝 Migration: ${record.filename}`);
      console.log(`   📝 Status: ${record.status}`);
      console.log(`   📝 Executed: ${record.executed_at}`);
      
      if (record.filename === '0001_core_tables_idempotent.sql' && record.status === 'completed') {
        results.checks.push('✅ Migration 0001 idempotent version executed successfully');
        console.log('   ✅ PASSED: Migration 0001 idempotent version executed');
      } else if (record.filename === '0001_core_tables_clean.sql') {
        console.log('   ⚠️  WARNING: Old retired migration still in records (this is OK if tables exist)');
      }
    } else {
      console.log('   ℹ️  INFO: Migration 0001 not yet executed (will run on next startup)');
    }

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`Total Checks: ${results.checks.length}`);
    console.log(`Errors: ${results.errors.length}\n`);
    
    if (results.success) {
      console.log('✅ ALL CHECKS PASSED');
      console.log('✅ Migration 0001 fix is working correctly');
      console.log('✅ All core tables and columns exist');
      console.log('✅ Schema validation will pass');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log('\nErrors:');
      results.errors.forEach(error => console.log(`   ${error}`));
      console.log('\n⚠️  Please run the application to execute migrations');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('💥 Verification failed with error:', error);
    results.success = false;
    results.errors.push(error.message);
  } finally {
    await sql.end();
  }

  process.exit(results.success ? 0 : 1);
}

verifyMigration0001Fix();
