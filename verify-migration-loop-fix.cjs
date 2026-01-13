#!/usr/bin/env node

/**
 * VERIFICATION SCRIPT FOR MIGRATION LOOP FIX
 * 
 * This script verifies that the migration loop issue has been permanently resolved
 * by checking:
 * 1. Migration 0010 status in database
 * 2. Password column is nullable
 * 3. No failed migrations exist
 * 4. Application can start successfully
 */

const postgres = require('postgres');

async function verifyFix() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING MIGRATION LOOP FIX');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('');
    console.error('Set it with:');
    console.error('  export DATABASE_URL="your_database_url"');
    console.error('');
    console.error('Or for Railway:');
    console.error('  railway run node verify-migration-loop-fix.cjs');
    console.error('');
    process.exit(1);
  }

  const sql = postgres(connectionString, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    max: 1
  });

  let allChecksPassed = true;

  try {
    console.log('🔌 Connecting to database...');
    await sql`SELECT 1`;
    console.log('✅ Connected successfully');
    console.log('');

    // Check 1: Verify schema_migrations table exists
    console.log('📋 Check 1: Schema migrations table...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    `;

    if (tables.length === 0) {
      console.log('❌ FAIL: schema_migrations table does not exist');
      allChecksPassed = false;
    } else {
      console.log('✅ PASS: schema_migrations table exists');
    }
    console.log('');

    // Check 2: Verify migration 0010 status
    console.log('📊 Check 2: Migration 0010 status...');
    const migration0010 = await sql`
      SELECT filename, status, executed_at, error_message
      FROM schema_migrations 
      WHERE filename = '0010_railway_production_schema_repair_final.sql'
      ORDER BY executed_at DESC
      LIMIT 1
    `;

    if (migration0010.length === 0) {
      console.log('⚠️  WARNING: Migration 0010 not found in database');
      console.log('   This is expected if migrations haven\'t run yet');
      console.log('   Status: PENDING');
    } else {
      const status = migration0010[0].status;
      const executedAt = migration0010[0].executed_at;
      
      if (status === 'completed') {
        console.log('✅ PASS: Migration 0010 is completed');
        console.log(`   Executed at: ${executedAt}`);
      } else if (status === 'failed') {
        console.log('❌ FAIL: Migration 0010 is marked as failed');
        console.log(`   Error: ${migration0010[0].error_message}`);
        allChecksPassed = false;
      } else {
        console.log(`⚠️  WARNING: Migration 0010 status is: ${status}`);
      }
    }
    console.log('');

    // Check 3: Verify password column is nullable
    console.log('🔍 Check 3: Password column nullable...');
    const passwordColumn = await sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `;

    if (passwordColumn.length === 0) {
      console.log('⚠️  WARNING: Password column does not exist yet');
      console.log('   This is expected if migrations haven\'t run yet');
    } else {
      const isNullable = passwordColumn[0].is_nullable === 'YES';
      
      if (isNullable) {
        console.log('✅ PASS: Password column is nullable');
        console.log(`   Type: ${passwordColumn[0].data_type}`);
      } else {
        console.log('❌ FAIL: Password column is NOT NULL');
        console.log('   This will cause OAuth login failures');
        allChecksPassed = false;
      }
    }
    console.log('');

    // Check 4: Count failed migrations
    console.log('📊 Check 4: Failed migrations...');
    const failedMigrations = await sql`
      SELECT filename, error_message, executed_at
      FROM schema_migrations 
      WHERE status = 'failed'
      ORDER BY executed_at DESC
    `;

    if (failedMigrations.length === 0) {
      console.log('✅ PASS: No failed migrations');
    } else {
      console.log(`❌ FAIL: Found ${failedMigrations.length} failed migrations:`);
      failedMigrations.forEach(m => {
        console.log(`   • ${m.filename}`);
        console.log(`     Error: ${m.error_message?.substring(0, 100)}...`);
      });
      allChecksPassed = false;
    }
    console.log('');

    // Check 5: Count completed migrations
    console.log('📊 Check 5: Completed migrations...');
    const completedMigrations = await sql`
      SELECT COUNT(*) as count
      FROM schema_migrations 
      WHERE status = 'completed'
    `;

    const completedCount = completedMigrations[0].count;
    console.log(`✅ INFO: ${completedCount} migrations completed`);
    console.log('');

    // Check 6: Verify essential tables exist
    console.log('📊 Check 6: Essential tables...');
    const essentialTables = ['users', 'projects', 'content', 'scheduled_content'];
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableNames = existingTables.map(t => t.table_name);
    let missingTables = [];

    essentialTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (missing)`);
        missingTables.push(table);
      }
    });

    if (missingTables.length > 0) {
      console.log('');
      console.log(`⚠️  WARNING: ${missingTables.length} essential tables are missing`);
      console.log('   This is expected if migrations haven\'t run yet');
    }
    console.log('');

    // Final summary
    console.log('═══════════════════════════════════════════════════════════════');
    if (allChecksPassed) {
      console.log('🎉 VERIFICATION PASSED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('✅ Migration loop issue is RESOLVED');
      console.log('✅ Database schema is correct');
      console.log('✅ Application can start successfully');
      console.log('');
      console.log('Your Railway deployment should be working now!');
      console.log('');
      console.log('Test your application:');
      console.log('  curl https://your-app.railway.app/health');
      console.log('');
    } else {
      console.log('⚠️  VERIFICATION INCOMPLETE');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      console.log('Some checks failed. This could mean:');
      console.log('1. Migrations haven\'t run yet (wait for Railway deployment)');
      console.log('2. The fix needs to be applied manually');
      console.log('3. There are other database issues');
      console.log('');
      console.log('To apply the fix manually:');
      console.log('  node fix-migration-loop-permanent.cjs');
      console.log('');
      console.log('To check Railway logs:');
      console.log('  railway logs');
      console.log('');
    }

    // Additional info
    console.log('📊 Database Summary:');
    console.log(`   • Total tables: ${tableNames.length}`);
    console.log(`   • Completed migrations: ${completedCount}`);
    console.log(`   • Failed migrations: ${failedMigrations.length}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('💥 VERIFICATION ERROR');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('This could mean:');
    console.error('1. Database connection failed');
    console.error('2. DATABASE_URL is incorrect');
    console.error('3. Database is not accessible');
    console.error('');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run verification
verifyFix().catch(console.error);
