#!/usr/bin/env node

/**
 * Diagnose Password Column State
 * Checks the actual database state to determine what columns exist
 */

const { Pool } = require('pg');
require('dotenv').config();

async function diagnosePasswordColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking users table column structure...\n');

    // Check what columns exist in users table
    const columnsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Current users table columns:');
    console.table(columnsResult.rows);

    // Check specifically for password-related columns
    const passwordColumns = columnsResult.rows.filter(row => 
      row.column_name.includes('password')
    );

    console.log('\n🔐 Password-related columns:');
    if (passwordColumns.length === 0) {
      console.log('❌ No password-related columns found!');
    } else {
      passwordColumns.forEach(col => {
        console.log(`  ✓ ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }

    // Check migration history - first check table structure
    const migrationTableCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'schema_migrations'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 schema_migrations table structure:');
    console.table(migrationTableCheck.rows);

    // Check all migrations
    const allMigrationsResult = await pool.query(`
      SELECT *
      FROM schema_migrations
      ORDER BY id DESC
      LIMIT 10;
    `);

    console.log('\n📜 Recent migrations:');
    if (allMigrationsResult.rows.length === 0) {
      console.log('  No migrations found in history');
    } else {
      console.table(allMigrationsResult.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

diagnosePasswordColumn().catch(console.error);
