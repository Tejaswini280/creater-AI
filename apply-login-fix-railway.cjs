#!/usr/bin/env node

/**
 * EMERGENCY FIX FOR LOGIN 500 ERROR
 * 
 * This script applies the database fix directly to Railway staging database
 * Run this if you need immediate fix without full deployment
 * 
 * Usage:
 *   RAILWAY_DATABASE_URL="postgresql://..." node apply-login-fix-railway.cjs
 */

const { Client } = require('pg');

async function applyLoginFix() {
  console.log('🚨 EMERGENCY LOGIN FIX - RAILWAY STAGING');
  console.log('='.repeat(70));
  console.log('');

  const databaseUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: No database URL found');
    console.error('   Set RAILWAY_DATABASE_URL or DATABASE_URL environment variable');
    console.error('');
    console.error('   Example:');
    console.error('   RAILWAY_DATABASE_URL="postgresql://..." node apply-login-fix-railway.cjs');
    process.exit(1);
  }

  console.log('🔗 Connecting to Railway database...');
  console.log('   URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('');

    // Step 1: Check current state
    console.log('📋 STEP 1: Checking current database state...');
    console.log('-'.repeat(70));
    
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('password', 'password_hash')
      ORDER BY column_name;
    `);

    console.log('Current columns:');
    console.table(columnCheck.rows);

    const hasPasswordHash = columnCheck.rows.some(r => r.column_name === 'password_hash');
    const hasPassword = columnCheck.rows.some(r => r.column_name === 'password');

    if (!hasPasswordHash && hasPassword) {
      console.log('✅ Database already has correct column name (password)');
      console.log('   No migration needed!');
      console.log('');
      
      // Check if it's nullable
      const passwordCol = columnCheck.rows.find(r => r.column_name === 'password');
      if (passwordCol.is_nullable === 'NO') {
        console.log('⚠️  Password column is NOT NULL, making it nullable...');
        await client.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL;');
        console.log('✅ Password column is now nullable');
      }
      
      await client.end();
      return;
    }

    // Step 2: Rename column
    if (hasPasswordHash) {
      console.log('');
      console.log('📋 STEP 2: Renaming password_hash to password...');
      console.log('-'.repeat(70));
      
      await client.query('ALTER TABLE users RENAME COLUMN password_hash TO password;');
      console.log('✅ Column renamed successfully');
    }

    // Step 3: Make nullable
    console.log('');
    console.log('📋 STEP 3: Making password column nullable...');
    console.log('-'.repeat(70));
    
    await client.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL;');
    console.log('✅ Password column is now nullable');

    // Step 4: Verify fix
    console.log('');
    console.log('📋 STEP 4: Verifying fix...');
    console.log('-'.repeat(70));
    
    const verifyColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'password';
    `);

    console.log('Final state:');
    console.table(verifyColumns.rows);

    // Step 5: Check user data
    console.log('');
    console.log('📋 STEP 5: Checking user password data...');
    console.log('-'.repeat(70));
    
    const userStats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(password) as users_with_password,
        COUNT(*) - COUNT(password) as users_without_password
      FROM users;
    `);

    console.table(userStats.rows);

    const usersWithoutPassword = parseInt(userStats.rows[0].users_without_password);
    if (usersWithoutPassword > 0) {
      console.log('');
      console.log('⚠️  WARNING: Some users have NULL passwords');
      console.log(`   ${usersWithoutPassword} users need passwords set`);
      console.log('');
      console.log('   Options:');
      console.log('   1. These are OAuth users (no action needed)');
      console.log('   2. Set default passwords for these users');
      console.log('   3. Force password reset on next login');
    }

    console.log('');
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('1. Restart Railway application to pick up changes');
    console.log('2. Test login with existing user credentials');
    console.log('3. Check Railway logs for login success messages');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR APPLYING FIX:');
    console.error('='.repeat(70));
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('1. Verify database URL is correct');
    console.error('2. Check database permissions');
    console.error('3. Ensure table "users" exists');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
applyLoginFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
