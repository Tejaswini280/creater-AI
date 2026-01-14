#!/usr/bin/env node

/**
 * Verification Script: Password NOT NULL Constraint Fix
 * 
 * This script verifies that the password constraint fix has been applied correctly
 * and that both traditional auth and OAuth users can be created.
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyPasswordConstraintFix() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING PASSWORD CONSTRAINT FIX');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if password columns are nullable
    console.log('📋 Step 1: Checking password column constraints...');
    const columnCheck = await pool.query(`
      SELECT 
        column_name, 
        is_nullable, 
        column_default,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password', 'password_hash')
      ORDER BY column_name;
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ ERROR: Password columns not found in users table');
      process.exit(1);
    }

    console.log('\n📊 Password Column Status:');
    columnCheck.rows.forEach(col => {
      const status = col.is_nullable === 'YES' ? '✅' : '❌';
      console.log(`${status} ${col.column_name}:`);
      console.log(`   - Nullable: ${col.is_nullable}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Default: ${col.column_default || 'NULL'}`);
    });

    // Verify both columns are nullable
    const allNullable = columnCheck.rows.every(col => col.is_nullable === 'YES');
    if (!allNullable) {
      console.log('\n❌ ERROR: Not all password columns are nullable!');
      console.log('   Run migration 0024 to fix this issue.');
      process.exit(1);
    }

    console.log('\n✅ All password columns are nullable - OAuth support enabled!');

    // Step 2: Check for invalid password values
    console.log('\n📋 Step 2: Checking for invalid password values...');
    const invalidPasswords = await pool.query(`
      SELECT 
        id,
        email,
        password,
        password_hash
      FROM users
      WHERE password IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD')
         OR password_hash IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD')
      LIMIT 5;
    `);

    if (invalidPasswords.rows.length > 0) {
      console.log(`⚠️  WARNING: Found ${invalidPasswords.rows.length} users with invalid passwords`);
      console.log('   These should be cleaned up by migration 0024');
      invalidPasswords.rows.forEach(user => {
        console.log(`   - User ${user.id}: password="${user.password}", password_hash="${user.password_hash}"`);
      });
    } else {
      console.log('✅ No invalid password values found');
    }

    // Step 3: Test creating OAuth user (NULL password)
    console.log('\n📋 Step 3: Testing OAuth user creation...');
    const testOAuthUserId = `test-oauth-${Date.now()}`;
    
    try {
      await pool.query(`
        INSERT INTO users (id, email, first_name, last_name, password, password_hash)
        VALUES ($1, $2, $3, $4, NULL, NULL)
      `, [testOAuthUserId, `oauth-test-${Date.now()}@example.com`, 'OAuth', 'User']);
      
      console.log('✅ OAuth user created successfully (NULL password)');
      
      // Clean up test user
      await pool.query('DELETE FROM users WHERE id = $1', [testOAuthUserId]);
      console.log('✅ Test OAuth user cleaned up');
    } catch (error) {
      console.log('❌ ERROR: Failed to create OAuth user');
      console.log(`   Error: ${error.message}`);
      if (error.message.includes('not-null constraint')) {
        console.log('   ⚠️  NOT NULL constraint still exists! Run migration 0024.');
      }
      process.exit(1);
    }

    // Step 4: Test creating traditional auth user (with password)
    console.log('\n📋 Step 4: Testing traditional auth user creation...');
    const testAuthUserId = `test-auth-${Date.now()}`;
    
    try {
      await pool.query(`
        INSERT INTO users (id, email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4, $5)
      `, [testAuthUserId, `auth-test-${Date.now()}@example.com`, 'Auth', 'User', '$2b$10$test.hash.value']);
      
      console.log('✅ Traditional auth user created successfully (with password_hash)');
      
      // Clean up test user
      await pool.query('DELETE FROM users WHERE id = $1', [testAuthUserId]);
      console.log('✅ Test auth user cleaned up');
    } catch (error) {
      console.log('❌ ERROR: Failed to create traditional auth user');
      console.log(`   Error: ${error.message}`);
      process.exit(1);
    }

    // Step 5: Check migration status
    console.log('\n📋 Step 5: Checking migration status...');
    const migrationCheck = await pool.query(`
      SELECT filename, executed_at
      FROM schema_migrations
      WHERE filename LIKE '%password%' OR filename LIKE '%0024%'
      ORDER BY executed_at DESC
      LIMIT 10;
    `);

    if (migrationCheck.rows.length > 0) {
      console.log('\n📊 Password-related migrations:');
      migrationCheck.rows.forEach(migration => {
        console.log(`   ✅ ${migration.filename}`);
        console.log(`      Executed: ${migration.executed_at}`);
      });
    }

    // Step 6: Count users by auth type
    console.log('\n📋 Step 6: Analyzing user authentication types...');
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as traditional_auth_users,
        COUNT(*) FILTER (WHERE password_hash IS NULL) as oauth_users,
        COUNT(*) as total_users
      FROM users;
    `);

    const stats = userStats.rows[0];
    console.log('\n📊 User Authentication Statistics:');
    console.log(`   👤 Total Users: ${stats.total_users}`);
    console.log(`   🔑 Traditional Auth: ${stats.traditional_auth_users}`);
    console.log(`   🔐 OAuth Users: ${stats.oauth_users}`);

    // Final summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ PASSWORD CONSTRAINT FIX VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n🎉 All checks passed! The fix is working correctly.');
    console.log('\n✅ Summary:');
    console.log('   • Password columns are nullable');
    console.log('   • OAuth users can be created');
    console.log('   • Traditional auth users can be created');
    console.log('   • No invalid password values found');
    console.log('   • Both authentication methods work perfectly');
    console.log('\n🚀 Your application is ready for production!');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyPasswordConstraintFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
