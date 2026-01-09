#!/usr/bin/env node

const { Client } = require('pg');

async function fixExistingSchema() {
  console.log('🔧 Fixing existing database schema...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'creators_dev_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Database connection successful');

    // Check if scheduled_content table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'scheduled_content'
      )
    `);

    if (tableCheck.rows[0].exists) {
      console.log('📋 scheduled_content table exists, checking columns...');
      
      // Get existing columns
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'scheduled_content'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Existing columns:', columns.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));

      // Add missing project_id column if it doesn't exist
      const hasProjectId = columns.rows.some(col => col.column_name === 'project_id');
      if (!hasProjectId) {
        console.log('➕ Adding project_id column...');
        await client.query('ALTER TABLE scheduled_content ADD COLUMN project_id INTEGER');
        console.log('✅ project_id column added');
      } else {
        console.log('✅ project_id column already exists');
      }
    } else {
      console.log('📋 scheduled_content table does not exist, creating...');
      await client.query(`
        CREATE TABLE scheduled_content (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          project_id INTEGER,
          title VARCHAR(255) NOT NULL,
          content_text TEXT,
          platform VARCHAR(50),
          scheduled_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ scheduled_content table created');
    }

    // Check users table for password column
    const userColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const hasPassword = userColumns.rows.some(col => col.column_name === 'password');
    if (!hasPassword) {
      console.log('➕ Adding password column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)');
      console.log('✅ password column added to users table');
    } else {
      console.log('✅ password column already exists in users table');
    }

    // Ensure we have at least one user
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (email, password, name) 
        VALUES ('test@example.com', '$2b$10$defaulthashedpassword', 'Test User')
      `);
      console.log('✅ Test user created');
    } else {
      console.log(`✅ Found ${userCount.rows[0].count} users in database`);
    }

    // Update any users without passwords
    await client.query(`
      UPDATE users 
      SET password = '$2b$10$defaulthashedpassword' 
      WHERE password IS NULL OR password = ''
    `);

    console.log('🎉 Database schema fixes completed successfully!');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

require('dotenv').config();
fixExistingSchema().catch(console.error);