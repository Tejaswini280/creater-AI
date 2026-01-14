#!/usr/bin/env node

/**
 * Verify Password Nullable Fix
 * 
 * This script verifies that the password nullable fix has been applied correctly.
 */

const { Client } = require('pg');

async function verifyFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check 1: Verify password column exists and is nullable
    console.log('📋 Check 1: Password column status');
    const columnCheck = await client.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ FAIL: Password column does not exist');
      process.exit(1);
    }

    const column = columnCheck.rows[0];
    console.log(`   Column Name: ${column.column_name}`);
    console.log(`   Data Type: ${column.data_type}`);
    console.log(`   Nullable: ${column.is_nullable}`);
    console.log(`   Default: ${column.column_default || 'NULL'}`);

    if (column.is_nullable === 'YES') {
      console.log('✅ PASS: Password column is nullable\n');
    } else {
      console.log('❌ FAIL: Password column is NOT nullable\n');
      process.exit(1);
    }

    // Check 2: Verify migration 0010 is marked as executed
    console.log('📋 Check 2: Migration 0010 status');
    const migration0010 = await client.query(`
      SELECT name, executed_at 
      FROM migrations 
      WHERE name = '0010_railway_production_schema_repair_final.sql'
    `);

    if (migration0010.rows.length > 0) {
      console.log(`✅ PASS: Migration 0010 is marked as executed (skipped)`);
      console.log(`   Executed at: ${migration0010.rows[0].executed_at}\n`);
    } else {
      console.log('⚠️  WARNING: Migration 0010 is not marked as executed');
      console.log('   This is OK if it hasn\'t been run yet\n');
    }

    // Check 3: Verify migration 0023 is executed
    console.log('📋 Check 3: Migration 0023 status');
    const migration0023 = await client.query(`
      SELECT name, executed_at 
      FROM migrations 
      WHERE name = '0023_fix_password_nullable_permanent.sql'
    `);

    if (migration0023.rows.length > 0) {
      console.log(`✅ PASS: Migration 0023 has been applied`);
      console.log(`   Executed at: ${migration0023.rows[0].executed_at}\n`);
    } else {
      console.log('⚠️  WARNING: Migration 0023 has not been applied yet');
      console.log('   Run: node skip-migration-0010-and-fix.cjs\n');
    }

    // Check 4: Verify users with null passwords exist
    console.log('📋 Check 4: Users with null passwords');
    const nullPasswordUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE password IS NULL
    `);

    const nullCount = parseInt(nullPasswordUsers.rows[0].count);
    console.log(`   Users with null passwords: ${nullCount}`);
    if (nullCount > 0) {
      console.log('✅ PASS: OAuth users can exist without passwords\n');
    } else {
      console.log('⚠️  INFO: No OAuth users yet (this is OK)\n');
    }

    // Check 5: Verify email unique constraint
    console.log('📋 Check 5: Email unique constraint');
    const emailConstraint = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_email_key'
    `);

    if (emailConstraint.rows.length > 0) {
      console.log('✅ PASS: Email unique constraint exists\n');
    } else {
      console.log('❌ FAIL: Email unique constraint is missing\n');
      process.exit(1);
    }

    // Final summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL CHECKS PASSED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Password column is nullable');
    console.log('✅ OAuth authentication is supported');
    console.log('✅ Email unique constraint exists');
    console.log('✅ Database is ready for production');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run verification
verifyFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
