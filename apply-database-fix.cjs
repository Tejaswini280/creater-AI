#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyDatabaseFix() {
  console.log('🔧 Starting database schema fix...');
  
  // Database connection configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'creators_dev_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };

  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful');

    // Read the SQL fix file
    const sqlFile = path.join(process.cwd(), 'fix-database-schema-complete.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Execute the fix
    console.log('🔄 Applying database schema fixes...');
    await client.query(sqlContent);
    console.log('✅ Database schema fixes applied successfully');

    // Verify the fixes
    console.log('🔍 Verifying schema fixes...');
    
    // Check users table
    const usersCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('password', 'email', 'id')
    `);
    console.log(`✅ Users table columns: ${usersCheck.rows.map(r => r.column_name).join(', ')}`);

    // Check scheduled_content table
    const scheduledCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'scheduled_content' AND column_name IN ('project_id', 'user_id', 'id')
    `);
    console.log(`✅ Scheduled content columns: ${scheduledCheck.rows.map(r => r.column_name).join(', ')}`);

    // Check if test user exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users in database: ${userCount.rows[0].count}`);

    console.log('🎉 Database schema fix completed successfully!');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Load environment variables
require('dotenv').config();

// Run the fix
applyDatabaseFix().catch(console.error);