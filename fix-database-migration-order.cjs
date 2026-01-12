#!/usr/bin/env node

/**
 * Fix Database Migration Order - Production Safe
 * 
 * This script fixes the migration order issue by ensuring tables exist
 * before trying to modify them.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixMigrationOrder() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database migration order fix...');
    
    // Step 1: Ensure users table exists with password column
    console.log('📋 Step 1: Ensuring users table exists with password column...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY NOT NULL,
          email VARCHAR NOT NULL UNIQUE,
          first_name VARCHAR NOT NULL,
          last_name VARCHAR NOT NULL,
          profile_image_url VARCHAR,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';
    `);
    
    // Step 2: Ensure post_schedules table exists
    console.log('📋 Step 2: Ensuring post_schedules table exists...');
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
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Step 3: Add missing columns to post_schedules
    console.log('📋 Step 3: Adding missing columns to post_schedules...');
    await client.query(`
      ALTER TABLE post_schedules
      ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50) DEFAULT 'none';
    `);
    
    await client.query(`
      ALTER TABLE post_schedules
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';
    `);
    
    await client.query(`
      ALTER TABLE post_schedules
      ADD COLUMN IF NOT EXISTS series_end_date TIMESTAMP;
    `);
    
    await client.query(`
      ALTER TABLE post_schedules 
      ADD COLUMN IF NOT EXISTS project_id INTEGER;
    `);
    
    // Step 4: Ensure content table exists
    console.log('📋 Step 4: Ensuring content table exists...');
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
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Step 5: Add missing columns to content table
    console.log('📋 Step 5: Adding missing columns to content table...');
    const contentColumns = [
      'day_number INTEGER',
      'is_paused BOOLEAN DEFAULT false',
      'is_stopped BOOLEAN DEFAULT false', 
      'can_publish BOOLEAN DEFAULT true',
      'publish_order INTEGER DEFAULT 0',
      'content_version INTEGER DEFAULT 1',
      'last_regenerated_at TIMESTAMP'
    ];
    
    for (const column of contentColumns) {
      const columnName = column.split(' ')[0];
      await client.query(`ALTER TABLE content ADD COLUMN IF NOT EXISTS ${column};`);
    }
    
    // Step 6: Create test user if needed
    console.log('📋 Step 6: Creating test user if needed...');
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name) 
      VALUES 
        ('test-user-migration-oauth', 'migration-fix@creatornexus.dev', 'OAuth', 'TestUser')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    console.log('✅ Database migration order fix completed successfully!');
    console.log('🚀 The application should now start without migration errors.');
    
  } catch (error) {
    console.error('❌ Migration order fix failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixMigrationOrder().catch(console.error);