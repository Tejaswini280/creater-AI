#!/usr/bin/env node

/**
 * EMERGENCY FIX: Apply Password NULL Constraint Fix
 * 
 * This script immediately applies the password constraint fix to resolve
 * the migration 0010 failure in production.
 * 
 * Usage:
 *   node apply-password-constraint-fix.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyPasswordConstraintFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Starting password constraint fix...\n');
    
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0021_fix_password_null_constraint_permanent.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Loaded migration 0021_fix_password_null_constraint_permanent.sql');

    // Execute the migration
    console.log('\n🔧 Applying fix...\n');
    await client.query(migrationSQL);

    console.log('\n✅ Password constraint fix applied successfully!');

    // Verify the fix
    console.log('\n🔍 Verifying fix...\n');

    const verification = await client.query(`
      SELECT 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `);

    if (verification.rows[0].is_nullable === 'YES') {
      console.log('✅ Password column is now nullable');
    } else {
      console.error('❌ Password column is still NOT NULL');
      process.exit(1);
    }

    // Get user statistics
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE password IS NULL) as oauth_users,
        COUNT(*) FILTER (WHERE password IS NOT NULL) as local_users,
        COUNT(*) as total_users
      FROM users
    `);

    const userStats = stats.rows[0];
    console.log('\n📊 User Statistics:');
    console.log(`   Total users: ${userStats.total_users}`);
    console.log(`   OAuth users: ${userStats.oauth_users}`);
    console.log(`   Local users: ${userStats.local_users}`);

    console.log('\n🎉 FIX COMPLETED SUCCESSFULLY!');
    console.log('✅ Migration 0010 will now succeed');
    console.log('✅ OAuth authentication is now supported');
    console.log('✅ You can now restart your application');

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
applyPasswordConstraintFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
