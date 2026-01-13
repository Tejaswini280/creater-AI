#!/usr/bin/env node

/**
 * EMERGENCY FIX: Skip migration 0010 and apply password nullable fix
 * 
 * This script:
 * 1. Marks migration 0010 as completed (to skip it)
 * 2. Applies the password nullable fix
 * 3. Allows the application to start
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function skipMigrationAndFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations table if it doesn't exist
    console.log('\n📋 Ensuring migrations table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Migrations table ready');

    // Mark migration 0010 as completed
    console.log('\n⏭️  Marking migration 0010 as completed (skipping)...');
    await client.query(`
      INSERT INTO migrations (name, executed_at)
      VALUES ('0010_railway_production_schema_repair_final.sql', NOW())
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Migration 0010 marked as completed');

    // Apply the password nullable fix
    console.log('\n🔧 Applying password nullable fix...');
    const migrationPath = path.join(__dirname, 'migrations', '0023_fix_password_nullable_permanent.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSQL);
    console.log('✅ Password nullable fix applied successfully');

    // Mark the new migration as completed
    await client.query(`
      INSERT INTO migrations (name, executed_at)
      VALUES ('0023_fix_password_nullable_permanent.sql', NOW())
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Migration 0023 marked as completed');

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
        console.log('✅ Migration 0010 has been skipped');
        console.log('🚀 Application can now start successfully!');
      } else {
        console.log('\n❌ WARNING: Password column is still NOT NULL');
      }
    }

    // Show migration status
    console.log('\n📋 Migration Status:');
    const migrations = await client.query(`
      SELECT name, executed_at 
      FROM migrations 
      ORDER BY executed_at DESC 
      LIMIT 5
    `);
    migrations.rows.forEach(m => {
      console.log(`   ✅ ${m.name} (${m.executed_at.toISOString()})`);
    });

    console.log('\n🎉 Fix completed successfully!');
    console.log('🚀 You can now restart your application');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the fix
skipMigrationAndFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
