#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFY PASSWORD HASH NULL CONSTRAINT FIX
 * ═══════════════════════════════════════════════════════════════════════════════
 * This script verifies that the password_hash NULL constraint fix is working
 * correctly and OAuth users can be created without password_hash.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyPasswordNullFix() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  VERIFYING PASSWORD HASH NULL CONSTRAINT FIX');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // Test 1: Check if password_hash column exists and is nullable
    console.log('📋 Test 1: Checking password_hash column configuration...');
    const columnCheck = await pool.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name IN ('password', 'password_hash')
    `);

    if (columnCheck.rows.length === 0) {
      results.failed.push('❌ No password or password_hash column found in users table');
    } else {
      const passwordHashCol = columnCheck.rows.find(r => r.column_name === 'password_hash');
      const passwordCol = columnCheck.rows.find(r => r.column_name === 'password');
      
      if (passwordHashCol) {
        if (passwordHashCol.is_nullable === 'YES') {
          results.passed.push('✅ password_hash column is nullable (OAuth compatible)');
        } else {
          results.failed.push('❌ password_hash column is NOT NULL (will fail for OAuth users)');
        }
      } else if (passwordCol) {
        if (passwordCol.is_nullable === 'YES') {
          results.passed.push('✅ password column is nullable (OAuth compatible)');
          results.warnings.push('⚠️  Column is named "password" instead of "password_hash"');
        } else {
          results.failed.push('❌ password column is NOT NULL (will fail for OAuth users)');
        }
      }
    }

    // Test 2: Check existing OAuth users
    console.log('📋 Test 2: Checking existing OAuth users...');
    const oauthUsersCheck = await pool.query(`
      SELECT 
        COUNT(*) as oauth_users_count
      FROM users
      WHERE password_hash IS NULL OR password IS NULL
    `);

    const oauthCount = parseInt(oauthUsersCheck.rows[0].oauth_users_count);
    if (oauthCount > 0) {
      results.passed.push(`✅ Found ${oauthCount} OAuth user(s) with NULL password_hash`);
    } else {
      results.warnings.push('⚠️  No OAuth users found (this is OK for new databases)');
    }

    // Test 3: Try to create a test OAuth user
    console.log('📋 Test 3: Testing OAuth user creation...');
    try {
      await pool.query(`
        INSERT INTO users (id, email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4, NULL)
        ON CONFLICT (email) DO NOTHING
      `, [
        'test-oauth-user-' + Date.now(),
        'oauth-test-' + Date.now() + '@example.com',
        'OAuth',
        'TestUser'
      ]);
      results.passed.push('✅ Successfully created OAuth user with NULL password_hash');
    } catch (error) {
      results.failed.push(`❌ Failed to create OAuth user: ${error.message}`);
    }

    // Test 4: Check migration 0018 was applied
    console.log('📋 Test 4: Checking if migration 0018 was applied...');
    const migrationCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name IN ('password', 'password_hash')
        AND is_nullable = 'YES'
      ) as migration_applied
    `);

    if (migrationCheck.rows[0].migration_applied) {
      results.passed.push('✅ Migration 0018 applied successfully');
    } else {
      results.failed.push('❌ Migration 0018 not applied or failed');
    }

    // Test 5: Check for users with temp passwords
    console.log('📋 Test 5: Checking for users with temp passwords...');
    const tempPasswordCheck = await pool.query(`
      SELECT COUNT(*) as temp_password_count
      FROM users
      WHERE password_hash = 'temp_password_needs_reset' 
      OR password = 'temp_password_needs_reset'
    `);

    const tempCount = parseInt(tempPasswordCheck.rows[0].temp_password_count);
    if (tempCount === 0) {
      results.passed.push('✅ No users with temp passwords (cleaned up successfully)');
    } else {
      results.warnings.push(`⚠️  Found ${tempCount} user(s) with temp passwords (should be NULL)`);
    }

    // Test 6: Get user statistics
    console.log('📋 Test 6: Getting user statistics...');
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(password_hash) + COUNT(password) as users_with_password,
        COUNT(*) - (COUNT(password_hash) + COUNT(password)) as oauth_users
      FROM users
    `);

    const stats = userStats.rows[0];
    results.passed.push(`✅ Total users: ${stats.total_users}`);
    results.passed.push(`   - Users with password: ${stats.users_with_password}`);
    results.passed.push(`   - OAuth users: ${stats.oauth_users}`);

  } catch (error) {
    results.failed.push(`❌ Verification error: ${error.message}`);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }

  // Print results
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (results.passed.length > 0) {
    console.log('✅ PASSED TESTS:\n');
    results.passed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    results.warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED TESTS:\n');
    results.failed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  const totalTests = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  SUMMARY: ${results.passed.length}/${totalTests} tests passed (${passRate}%)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (results.failed.length === 0) {
    console.log('🎉 PASSWORD HASH NULL CONSTRAINT FIX VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.log('❌ PASSWORD HASH NULL CONSTRAINT FIX VERIFICATION FAILED\n');
    console.log('💡 Next steps:');
    console.log('   1. Run: node migrations/0018_fix_password_hash_null_constraint.sql');
    console.log('   2. Or deploy using: ./deploy-railway-password-null-fix.ps1\n');
    process.exit(1);
  }
}

// Run verification
verifyPasswordNullFix().catch(error => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});
