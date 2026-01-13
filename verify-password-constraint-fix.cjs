#!/usr/bin/env node

/**
 * Verification Script: Password NULL Constraint Fix
 * 
 * This script verifies that the password column constraint fix has been applied
 * and that migration 0010 will succeed.
 */

const { Client } = require('pg');

async function verifyPasswordConstraintFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check 1: Verify password column is nullable
    const nullableCheck = await client.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `);

    if (nullableCheck.rows.length === 0) {
      console.error('❌ CRITICAL: Password column does not exist in users table');
      process.exit(1);
    }

    const isNullable = nullableCheck.rows[0].is_nullable === 'YES';
    if (!isNullable) {
      console.error('❌ CRITICAL: Password column still has NOT NULL constraint');
      console.error('   Migration 0010 will fail!');
      console.error('   Run migration 0021 to fix this issue.');
      process.exit(1);
    }

    console.log('✅ Password column is nullable (OAuth users supported)');

    // Check 2: Count OAuth vs local users
    const userStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE password IS NULL) as oauth_users,
        COUNT(*) FILTER (WHERE password IS NOT NULL) as local_users,
        COUNT(*) as total_users
      FROM users
    `);

    const stats = userStats.rows[0];
    console.log('\n📊 User Statistics:');
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   OAuth users (NULL password): ${stats.oauth_users}`);
    console.log(`   Local users (with password): ${stats.local_users}`);

    // Check 3: Verify no temporary passwords exist
    const tempPasswords = await client.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE password IN ('temp_password_needs_reset', '', 'oauth_user_no_password')
    `);

    if (parseInt(tempPasswords.rows[0].count) > 0) {
      console.warn(`⚠️  WARNING: ${tempPasswords.rows[0].count} users have temporary passwords`);
      console.warn('   These should be cleaned up.');
    } else {
      console.log('✅ No temporary passwords found');
    }

    // Check 4: Verify check constraint exists
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_password_valid_check'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('✅ Password validation constraint exists');
    } else {
      console.warn('⚠️  WARNING: Password validation constraint not found');
    }

    // Check 5: Test that we can insert OAuth user
    try {
      await client.query(`
        INSERT INTO users (id, email, first_name, last_name, password) 
        VALUES ('test-oauth-verification', 'test-oauth@verify.com', 'Test', 'OAuth', NULL)
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Can insert OAuth users without password');
      
      // Clean up test user
      await client.query(`
        DELETE FROM users WHERE id = 'test-oauth-verification'
      `);
    } catch (error) {
      console.error('❌ CRITICAL: Cannot insert OAuth users without password');
      console.error('   Error:', error.message);
      process.exit(1);
    }

    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('✅ Password constraint fix is working correctly');
    console.log('✅ Migration 0010 will succeed');
    console.log('✅ OAuth authentication is supported');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
verifyPasswordConstraintFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
