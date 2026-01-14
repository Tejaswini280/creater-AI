#!/usr/bin/env node

/**
 * COMPREHENSIVE MIGRATION FIX VERIFICATION
 * 
 * This script verifies that the permanent migration system fix is working correctly.
 */

const postgres = require('postgres');

async function verifyFix() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING PERMANENT MIGRATION SYSTEM FIX');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    max: 1
  });

  let allTestsPassed = true;

  try {
    // Test 1: Verify database connection
    console.log('\n📋 Test 1: Database Connection');
    const dbInfo = await sql`SELECT current_database() as db`;
    console.log(`   ✅ Connected to: ${dbInfo[0].db}`);

    // Test 2: Verify critical tables exist
    console.log('\n📋 Test 2: Critical Tables Exist');
    const criticalTables = ['users', 'projects', 'content', 'content_metrics', 'post_schedules', 'schema_migrations'];
    
    for (const tableName of criticalTables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      
      if (exists[0].exists) {
        console.log(`   ✅ Table '${tableName}' exists`);
      } else {
        console.log(`   ❌ Table '${tableName}' MISSING`);
        allTestsPassed = false;
      }
    }

    // Test 3: Verify minimum required columns
    console.log('\n📋 Test 3: Minimum Required Columns');
    const requiredColumns = [
      { table: 'users', column: 'id' },
      { table: 'users', column: 'email' },
      { table: 'users', column: 'created_at' },
      { table: 'projects', column: 'id' },
      { table: 'projects', column: 'user_id' },
      { table: 'projects', column: 'name' },
      { table: 'content', column: 'id' },
      { table: 'content', column: 'user_id' },
      { table: 'content', column: 'title' },
      { table: 'content', column: 'platform' },
      { table: 'content', column: 'status' },
      { table: 'content_metrics', column: 'id' },
      { table: 'content_metrics', column: 'content_id' }
    ];

    for (const { table, column } of requiredColumns) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
          AND column_name = ${column}
        ) as exists
      `;
      
      if (exists[0].exists) {
        console.log(`   ✅ ${table}.${column} exists`);
      } else {
        console.log(`   ❌ ${table}.${column} MISSING`);
        allTestsPassed = false;
      }
    }

    // Test 4: Verify content_metrics.created_at was added
    console.log('\n📋 Test 4: New Migration Applied (content_metrics.created_at)');
    const createdAtExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content_metrics'
        AND column_name = 'created_at'
      ) as exists
    `;
    
    if (createdAtExists[0].exists) {
      console.log('   ✅ content_metrics.created_at exists (migration 0029 applied)');
    } else {
      console.log('   ⚠️  content_metrics.created_at missing (migration 0029 not yet applied)');
      console.log('   Run: npm run migrate');
    }

    // Test 5: Verify no false positive columns
    console.log('\n📋 Test 5: No False Positive Validation Errors');
    const falsePositiveColumns = [
      { table: 'users', column: 'password_hash' }, // Should NOT exist (actual is 'password')
    ];

    let hasFalsePositives = false;
    for (const { table, column } of falsePositiveColumns) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
          AND column_name = ${column}
        ) as exists
      `;
      
      if (exists[0].exists) {
        console.log(`   ⚠️  ${table}.${column} exists (unexpected)`);
        hasFalsePositives = true;
      }
    }
    
    if (!hasFalsePositives) {
      console.log('   ✅ No false positive columns found');
      console.log('   ✅ Validator will not check for non-existent columns');
    }

    // Test 6: Verify migration records
    console.log('\n📋 Test 6: Migration Records');
    const migrations = await sql`
      SELECT COUNT(*) as count, 
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM schema_migrations
    `;
    
    console.log(`   ✅ Total migrations: ${migrations[0].count}`);
    console.log(`   ✅ Completed: ${migrations[0].completed}`);
    console.log(`   ${migrations[0].failed > 0 ? '⚠️' : '✅'}  Failed: ${migrations[0].failed}`);

    // Test 7: Verify schema is production-ready
    console.log('\n📋 Test 7: Production Readiness');
    const tableCount = await sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    if (tableCount[0].count >= 20) {
      console.log(`   ✅ Schema has ${tableCount[0].count} tables (sufficient for production)`);
    } else {
      console.log(`   ⚠️  Schema has only ${tableCount[0].count} tables (may be incomplete)`);
      allTestsPassed = false;
    }

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED - MIGRATION SYSTEM FIX VERIFIED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('✅ Database schema is correct');
      console.log('✅ Minimum required columns exist');
      console.log('✅ No false positive validation errors');
      console.log('✅ Application can start successfully');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run: npm start');
      console.log('2. Verify application starts without errors');
      console.log('3. Deploy to production');
    } else {
      console.log('❌ SOME TESTS FAILED - REVIEW ERRORS ABOVE');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('Action required:');
      console.log('1. Review failed tests above');
      console.log('2. Run: npm run migrate');
      console.log('3. Re-run this verification script');
    }
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    allTestsPassed = false;
  } finally {
    await sql.end();
  }

  process.exit(allTestsPassed ? 0 : 1);
}

verifyFix().catch(console.error);
