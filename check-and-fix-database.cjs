#!/usr/bin/env node

const { Client } = require('pg');

async function checkAndFixDatabase() {
  console.log('🔧 Checking and fixing database schema...');
  
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

    // Check existing tables
    console.log('🔍 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables.join(', '));

    // Create missing tables
    console.log('🔄 Creating/updating required tables...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add password column if missing
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)
      `);
    } catch (e) {
      // Column might already exist
      console.log('Password column already exists or added');
    }

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Content table (this might be what scheduled_content should reference)
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        title VARCHAR(255) NOT NULL,
        content_text TEXT,
        platform VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scheduled content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        content_id INTEGER REFERENCES content(id),
        title VARCHAR(255) NOT NULL,
        content_text TEXT,
        platform VARCHAR(50),
        scheduled_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_content_user_id ON scheduled_content(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_content_project_id ON scheduled_content(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (e) {
        console.log('Index already exists:', e.message);
      }
    }

    // Insert test user if none exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (email, password, name) 
        VALUES ('test@example.com', '$2b$10$defaulthashedpassword', 'Test User')
      `);
      console.log('✅ Test user created');
    }

    // Verify final state
    console.log('🔍 Final verification...');
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Final tables:', finalTables.rows.map(row => row.table_name).join(', '));

    const finalUserCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👤 Users in database: ${finalUserCount.rows[0].count}`);

    console.log('🎉 Database schema fix completed successfully!');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Load environment variables
require('dotenv').config();

// Run the fix
checkAndFixDatabase().catch(console.error);