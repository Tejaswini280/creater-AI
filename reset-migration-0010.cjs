#!/usr/bin/env node

/**
 * Reset Migration 0010
 * 
 * This script removes migration 0010 from the migrations table
 * so it can be re-run with the safe version.
 */

const { Client } = require('pg');

async function resetMigration0010() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if migration 0010 exists in the migrations table
    console.log('🔍 Checking migration 0010 status...');
    const checkResult = await client.query(`
      SELECT name, executed_at 
      FROM migrations 
      WHERE name = '0010_railway_production_schema_repair_final.sql'
    `);

    if (checkResult.rows.length === 0) {
      console.log('✅ Migration 0010 has not been executed yet');
      console.log('   The safe version will run on next startup\n');
    } else {
      console.log('⚠️  Migration 0010 was previously executed');
      console.log(`   Executed at: ${checkResult.rows[0].executed_at}`);
      
      // Delete the migration record
      console.log('\n🗑️  Removing migration 0010 from history...');
      await client.query(`
        DELETE FROM migrations 
        WHERE name = '0010_railway_production_schema_repair_final.sql'
      `);
      console.log('✅ Migration 0010 removed from history');
      console.log('   The safe version will run on next startup\n');
    }

    // Ensure password column is nullable NOW
    console.log('🔧 Ensuring password column is nullable...');
    await client.query(`
      DO $
      BEGIN
          IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' 
              AND column_name = 'password' 
              AND is_nullable = 'NO'
          ) THEN
              ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
              RAISE NOTICE 'Removed NOT NULL constraint from password column';
          END IF;
      END $;
    `);
    console.log('✅ Password column is now nullable\n');

    // Verify the fix
    console.log('🔍 Verifying password column status...');
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
      console.log(`   Column Name: ${column.column_name}`);
      console.log(`   Data Type: ${column.data_type}`);
      console.log(`   Nullable: ${column.is_nullable}`);

      if (column.is_nullable === 'YES') {
        console.log('\n✅ SUCCESS: Password column is nullable');
        console.log('✅ OAuth authentication is supported');
        console.log('🚀 Application can now start successfully!\n');
      } else {
        console.log('\n❌ WARNING: Password column is still NOT NULL');
        console.log('   Manual intervention may be required\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 MIGRATION 0010 RESET COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Migration 0010 (safe version) will run automatically');
    console.log('3. Application should start without errors');
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

// Run the reset
resetMigration0010().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
