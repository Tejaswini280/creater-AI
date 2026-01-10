#!/usr/bin/env node

/**
 * Quick Local Database Setup
 * 
 * This script sets up a local PostgreSQL database with the correct schema
 * so the application can start successfully.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Local database configuration
const LOCAL_DB_CONFIG = {
  user: 'postgres',
  host: 'localhost', 
  database: 'creators_dev_db',
  password: '', // Empty password for local development
  port: 5432,
};

async function setupLocalDatabase() {
  console.log('🔧 Setting up local database for development...');
  
  // First, try to connect to postgres database to create our database
  const adminPool = new Pool({
    ...LOCAL_DB_CONFIG,
    database: 'postgres' // Connect to default postgres database
  });
  
  try {
    console.log('📋 Step 1: Creating database if it doesn\'t exist...');
    const adminClient = await adminPool.connect();
    
    // Create database if it doesn't exist
    try {
      await adminClient.query(`CREATE DATABASE ${LOCAL_DB_CONFIG.database}`);
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️ Database already exists');
      } else {
        throw error;
      }
    }
    
    adminClient.release();
    await adminPool.end();
    
    // Now connect to our database
    console.log('📋 Step 2: Setting up schema...');
    const pool = new Pool(LOCAL_DB_CONFIG);
    const client = await pool.connect();
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create essential tables
    console.log('📋 Step 3: Creating essential tables...');
    
    // Users table with password column
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY NOT NULL,
          email VARCHAR NOT NULL UNIQUE,
          password TEXT NOT NULL DEFAULT 'temp_password_needs_reset',
          first_name VARCHAR NOT NULL,
          last_name VARCHAR NOT NULL,
          profile_image_url VARCHAR,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
          id SERIAL PRIMARY KEY NOT NULL,
          user_id VARCHAR NOT NULL,
          project_id INTEGER,
          title VARCHAR NOT NULL,
          description TEXT,
          script TEXT,
          platform VARCHAR NOT NULL,
          content_type VARCHAR NOT NULL,
          status VARCHAR DEFAULT 'draft' NOT NULL,
          scheduled_at TIMESTAMP,
          published_at TIMESTAMP,
          thumbnail_url VARCHAR,
          video_url VARCHAR,
          tags TEXT[],
          metadata JSONB,
          ai_generated BOOLEAN DEFAULT false,
          day_number INTEGER,
          is_paused BOOLEAN DEFAULT false,
          is_stopped BOOLEAN DEFAULT false,
          can_publish BOOLEAN DEFAULT true,
          publish_order INTEGER DEFAULT 0,
          content_version INTEGER DEFAULT 1,
          last_regenerated_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Post schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_schedules (
          id SERIAL PRIMARY KEY NOT NULL,
          social_post_id INTEGER NOT NULL,
          platform VARCHAR NOT NULL,
          scheduled_at TIMESTAMP NOT NULL,
          status VARCHAR DEFAULT 'pending' NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_attempt_at TIMESTAMP,
          error_message TEXT,
          metadata JSONB,
          recurrence VARCHAR(50) DEFAULT 'none',
          timezone VARCHAR(100) DEFAULT 'UTC',
          series_end_date TIMESTAMP,
          project_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY NOT NULL,
          user_id VARCHAR NOT NULL,
          name VARCHAR NOT NULL,
          description TEXT,
          type VARCHAR NOT NULL,
          template VARCHAR,
          platform VARCHAR,
          target_audience VARCHAR,
          estimated_duration VARCHAR,
          tags TEXT[],
          is_public BOOLEAN DEFAULT false,
          status VARCHAR DEFAULT 'active' NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Sessions table (required for express-session)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY NOT NULL,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
      )
    `);
    
    // Create session index
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire)
    `);
    
    // Create test user
    console.log('📋 Step 4: Creating test user...');
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name) 
      VALUES 
        ('test-user-local', 'test@example.com', 'hashed_password_placeholder', 'Test', 'User')
      ON CONFLICT (email) DO NOTHING
    `);
    
    console.log('✅ Local database setup completed successfully!');
    console.log('🚀 You can now start the application with: npm start');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Local database setup failed:', error.message);
    console.error('🔧 Make sure PostgreSQL is installed and running locally');
    console.error('   - Install PostgreSQL: https://www.postgresql.org/download/');
    console.error('   - Start PostgreSQL service');
    console.error('   - Create a user "postgres" with no password (or update .env)');
  }
}

setupLocalDatabase().catch(console.error);