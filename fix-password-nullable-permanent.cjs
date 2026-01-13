#!/usr/bin/env node

/**
 * PERMANENT FIX: Make password column nullable for OAuth users
 * 
 * This script:
 * 1. Connects to the database
 * 2. Makes password column nullable
 * 3. Cleans up invalid password values
 * 4. Validates the fix
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixPasswordNullable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0023_fix_password_nullable_permanent.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n🔧 Applying password nullable fix...');
    await client.query(migrationSQL);
    console.log('✅ Password nullable fix applied successfully');

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyResult = await client.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `);

    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log('\n📊 Password Column Status:');
      console.log(`   Column Name: ${column.column_name}`);
      console.log(`   Data Type: ${column.data_type}`);
      console.log(`   Nullable: ${column.is_nullable}`);

      if (column.is_nullable === 'YES') {
        console.log('\n✅ SUCCESS: Password column is now nullable');
        console.log('✅ OAuth/passwordless authentication is supported');
      } else {
        console.log('\n❌ WARNING: Password column is still NOT NULL');
      }
    }

    // Check for users with null passwords
    const nullPasswordCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE password IS NULL
    `);
    console.log(`\n📊 Users with null passwords: ${nullPasswordCount.rows[0].count}`);

    console.log('\n🎉 Password nullable fix completed successfully!');
    console.log('🚀 You can now create OAuth users without passwords');

  } catch (error) {
    console.error('\n❌ Error applying password nullable fix:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the fix
fixPasswordNullable().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
