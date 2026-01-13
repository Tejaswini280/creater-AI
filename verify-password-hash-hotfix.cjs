#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFY PASSWORD HASH HOTFIX
 * ═══════════════════════════════════════════════════════════════════════════════
 * This script verifies that the password_hash NULL constraint fix was applied
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyPasswordHashFix() {
  console.log('🔍 Verifying password_hash hotfix...\n');

  try {
    // Check if password_hash column allows NULL
    const columnCheck = await pool.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name IN ('password_hash', 'password')
      ORDER BY column_name;
    `);

    console.log('📊 Column Configuration:');
    console.log('═══════════════════════════════════════════════════════════════');
    columnCheck.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✅ Allows NULL' : '❌ NOT NULL';
      console.log(`Column: ${col.column_name}`);
      console.log(`  Type: ${col.data_type}`);
      console.log(`  Nullable: ${nullable}`);
      console.log(`  Default: ${col.column_default || 'None'}`);
      console.log('');
    });

    // Check user data
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE password_hash IS NULL) as oauth_users,
        COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as local_users
      FROM users;
    `);

    console.log('👥 User Statistics:');
    console.log('═══════════════════════════════════════════════════════════════');
    const stats = userStats.rows[0];
    console.log(`Total Users: ${stats.total_users}`);
    console.log(`OAuth Users (NULL password_hash): ${stats.oauth_users}`);
    console.log(`Local Users (with password_hash): ${stats.local_users}`);
    console.log('');

    // Verify the fix
    const passwordHashColumn = columnCheck.rows.find(col => col.column_name === 'password_hash');
    
    if (!passwordHashColumn) {
      console.log('❌ FAILED: password_hash column does not exist');
      process.exit(1);
    }

    if (passwordHashColumn.is_nullable !== 'YES') {
      console.log('❌ FAILED: password_hash column still has NOT NULL constraint');
      console.log('');
      console.log('🔧 To fix this, run:');
      console.log('   ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;');
      process.exit(1);
    }

    console.log('✅ SUCCESS: Password hash hotfix verified!');
    console.log('');
    console.log('✓ password_hash column allows NULL values');
    console.log('✓ OAuth users can have NULL password_hash');
    console.log('✓ Migration should complete successfully');
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

// Run verification
verifyPasswordHashFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
