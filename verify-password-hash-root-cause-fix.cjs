#!/usr/bin/env node

/**
 * Verify Password Hash Root Cause Fix
 * Confirms that password_hash column allows NULL values
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyFix() {
  console.log('🔍 Verifying password_hash root cause fix...\n');

  try {
    // Check password_hash column configuration
    const columnCheck = await pool.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'password_hash';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ FAILED: password_hash column does not exist');
      process.exit(1);
    }

    const column = columnCheck.rows[0];
    console.log('📊 Column Configuration:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Column: ${column.column_name}`);
    console.log(`Type: ${column.data_type}`);
    console.log(`Nullable: ${column.is_nullable === 'YES' ? '✅ YES' : '❌ NO'}`);
    console.log(`Default: ${column.column_default || 'None'}`);
    console.log('');

    // Check user data
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE password_hash IS NULL) as oauth_users,
        COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as local_users
      FROM users;
    `);

    const stats = userStats.rows[0];
    console.log('👥 User Statistics:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Users: ${stats.total_users}`);
    console.log(`OAuth Users (NULL password_hash): ${stats.oauth_users}`);
    console.log(`Local Users (with password_hash): ${stats.local_users}`);
    console.log('');

    // Verify the fix
    if (column.is_nullable !== 'YES') {
      console.log('❌ FAILED: password_hash column still has NOT NULL constraint');
      console.log('');
      console.log('This means the migrations have not been updated yet.');
      console.log('Check that migrations 0007 and 0009 have been fixed.');
      process.exit(1);
    }

    console.log('✅ SUCCESS: Root cause fix verified!');
    console.log('');
    console.log('✓ password_hash column allows NULL values');
    console.log('✓ OAuth users can have NULL password_hash');
    console.log('✓ Local users can have password hashes');
    console.log('✓ Migrations should complete successfully');
    console.log('');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
