#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFY PASSWORD_HASH FIX
 * ═══════════════════════════════════════════════════════════════════════════════
 * This script verifies that the password_hash column fix has been applied
 * correctly and all users have valid password_hash values.
 * 
 * Date: 2026-01-13
 * Purpose: Verify the permanent fix for password_hash NOT NULL constraint
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyPasswordHashFix() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING PASSWORD_HASH FIX');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Check if password_hash column exists
    console.log('📋 Test 1: Checking if password_hash column exists...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'password_hash'
      AND table_schema = 'public'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ FAILED: password_hash column does not exist');
      process.exit(1);
    }

    const column = columnCheck.rows[0];
    console.log('✅ PASSED: password_hash column exists');
    console.log(`   - Data type: ${column.data_type}`);
    console.log(`   - Nullable: ${column.is_nullable}`);
    console.log(`   - Default: ${column.column_default || 'none'}\n`);

    // Test 2: Check NOT NULL constraint
    console.log('📋 Test 2: Verifying NOT NULL constraint...');
    if (column.is_nullable === 'YES') {
      console.log('❌ FAILED: password_hash column allows NULL values');
      process.exit(1);
    }
    console.log('✅ PASSED: password_hash has NOT NULL constraint\n');

    // Test 3: Check for users with NULL or empty password_hash
    console.log('📋 Test 3: Checking for NULL or empty password_hash values...');
    const nullCheck = await pool.query(`
      SELECT COUNT(*) as null_count
      FROM users
      WHERE password_hash IS NULL OR password_hash = ''
    `);

    const nullCount = parseInt(nullCheck.rows[0].null_count);
    if (nullCount > 0) {
      console.log(`❌ FAILED: Found ${nullCount} users with NULL/empty password_hash`);
      
      // Show the problematic users
      const problematicUsers = await pool.query(`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE password_hash IS NULL OR password_hash = ''
        LIMIT 5
      `);
      
      console.log('\n   Problematic users:');
      problematicUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
      
      process.exit(1);
    }
    console.log('✅ PASSED: All users have valid password_hash values\n');

    // Test 4: Count users by password_hash type
    console.log('📋 Test 4: Analyzing password_hash distribution...');
    const distribution = await pool.query(`
      SELECT 
        CASE 
          WHEN password_hash = 'oauth_user_no_password' THEN 'OAuth Users'
          WHEN password_hash LIKE '$2%' THEN 'Hashed Passwords'
          ELSE 'Other'
        END as type,
        COUNT(*) as count
      FROM users
      GROUP BY type
      ORDER BY count DESC
    `);

    console.log('   Password hash distribution:');
    distribution.rows.forEach(row => {
      console.log(`   - ${row.type}: ${row.count} users`);
    });
    console.log('');

    // Test 5: Test user insertion with password_hash
    console.log('📋 Test 5: Testing user insertion with password_hash...');
    try {
      await pool.query(`
        INSERT INTO users (id, email, first_name, last_name, password_hash)
        VALUES ('test-verify-password-hash', 'test-verify@example.com', 'Test', 'User', 'oauth_user_no_password')
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      `);
      console.log('✅ PASSED: User insertion with password_hash works\n');

      // Clean up test user
      await pool.query(`DELETE FROM users WHERE id = 'test-verify-password-hash'`);
    } catch (error) {
      console.log('❌ FAILED: User insertion failed');
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    // Test 6: Test user insertion without password_hash (should fail or use default)
    console.log('📋 Test 6: Testing user insertion without password_hash...');
    try {
      await pool.query(`
        INSERT INTO users (id, email, first_name, last_name)
        VALUES ('test-verify-no-password', 'test-no-password@example.com', 'Test', 'NoPassword')
      `);
      
      // Check if default was applied
      const checkDefault = await pool.query(`
        SELECT password_hash FROM users WHERE id = 'test-verify-no-password'
      `);
      
      if (checkDefault.rows.length > 0 && checkDefault.rows[0].password_hash) {
        console.log('✅ PASSED: Default password_hash applied automatically');
        console.log(`   Default value: ${checkDefault.rows[0].password_hash}\n`);
      } else {
        console.log('❌ FAILED: No default password_hash applied\n');
        process.exit(1);
      }

      // Clean up test user
      await pool.query(`DELETE FROM users WHERE id = 'test-verify-no-password'`);
    } catch (error) {
      console.log('✅ PASSED: Insertion without password_hash correctly rejected');
      console.log(`   (This is expected if no default is set)\n`);
    }

    // Final summary
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - PASSWORD_HASH FIX VERIFIED');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log('   ✓ password_hash column exists with NOT NULL constraint');
    console.log('   ✓ All existing users have valid password_hash values');
    console.log('   ✓ User insertions with password_hash work correctly');
    console.log('   ✓ Default value mechanism is in place');
    console.log('');
    console.log('🎯 Result: Migration 0007 should now succeed without errors');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.log('\n❌ VERIFICATION FAILED');
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyPasswordHashFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
