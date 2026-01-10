#!/usr/bin/env node

/**
 * ROOT CAUSE DATABASE FIX SCRIPT
 * 
 * This script applies the complete database schema fix to resolve
 * the "column project_id does not exist" error at its source.
 * 
 * This is the EXACT SOLUTION for the migration failure issue.
 */

const postgres = require('postgres');
const { readFileSync } = require('fs');
const path = require('path');

// Database configuration
const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

async function applyRootCauseFix() {
  console.log('🔧 APPLYING ROOT CAUSE DATABASE SCHEMA FIX');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('This will fix the "column project_id does not exist" error');
  console.log('by recreating all tables with the correct schema.');
  console.log('');

  let sql;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    sql = postgres(config.connectionString, {
      ssl: config.ssl,
      max: config.max,
      idle_timeout: config.idle_timeout,
      connect_timeout: config.connect_timeout
    });

    await sql`SELECT 1`;
    console.log('✅ Database connection successful');

    // Read the fix SQL file
    console.log('📄 Reading schema fix file...');
    const fixSqlPath = path.join(__dirname, 'fix-database-schema-root-cause.sql');
    const fixSql = readFileSync(fixSqlPath, 'utf8');
    console.log('✅ Schema fix file loaded');

    // Apply the fix
    console.log('🔧 Applying complete schema fix...');
    console.log('⚠️  This will drop and recreate tables - data will be lost');
    console.log('⏳ Processing...');
    
    await sql.unsafe(fixSql);
    
    console.log('✅ Schema fix applied successfully');

    // Verify the fix
    console.log('🔍 Verifying schema fix...');
    
    // Check that users table has password column
    const usersColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password'
    `;
    
    if (usersColumns.length === 0) {
      throw new Error('Users table missing password column');
    }
    console.log('✅ Users table has password column');

    // Check that content table has project_id column
    const contentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name = 'project_id'
    `;
    
    if (contentColumns.length === 0) {
      throw new Error('Content table missing project_id column');
    }
    console.log('✅ Content table has project_id column');

    // Check that post_schedules table has project_id column
    const scheduleColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'post_schedules' 
      AND column_name = 'project_id'
    `;
    
    if (scheduleColumns.length === 0) {
      throw new Error('Post_schedules table missing project_id column');
    }
    console.log('✅ Post_schedules table has project_id column');

    // Check that schema_migrations table exists
    const migrationTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'schema_migrations'
    `;
    
    if (migrationTable.length === 0) {
      throw new Error('Schema_migrations table missing');
    }
    console.log('✅ Schema_migrations table exists');

    console.log('');
    console.log('🎉 ROOT CAUSE FIX COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ All tables recreated with correct schema');
    console.log('✅ Missing columns added (password, project_id)');
    console.log('✅ Migration tracking table created');
    console.log('✅ All migrations marked as applied');
    console.log('');
    console.log('🚀 Your application should now start without migration errors!');
    console.log('');

  } catch (error) {
    console.error('❌ ROOT CAUSE FIX FAILED:', error.message);
    console.error('');
    console.error('Error details:', error);
    throw error;
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
applyRootCauseFix()
  .then(() => {
    console.log('✅ Root cause fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Root cause fix failed:', error);
    process.exit(1);
  });