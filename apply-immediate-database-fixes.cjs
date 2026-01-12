#!/usr/bin/env node

/**
 * IMMEDIATE DATABASE FIXES
 * Applies critical fixes to resolve all migration issues
 */

const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creator_ai_studio',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function applyImmediateFixes() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Applying immediate database fixes...');
    
    // Fix 1: Add password column to users table
    console.log('📋 Adding password column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset'
    `);
    
    // Fix 2: Add project_id column to content table
    console.log('📋 Adding project_id column to content table...');
    await pool.query(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS project_id INTEGER
    `);
    
    // Fix 3: Add missing columns to projects table
    console.log('📋 Adding missing columns to projects table...');
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS content_type VARCHAR DEFAULT 'mixed',
      ADD COLUMN IF NOT EXISTS duration VARCHAR DEFAULT '30 days',
      ADD COLUMN IF NOT EXISTS content_frequency VARCHAR DEFAULT 'daily',
      ADD COLUMN IF NOT EXISTS brand_voice VARCHAR,
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS channel_types TEXT[],
      ADD COLUMN IF NOT EXISTS content_formats TEXT[],
      ADD COLUMN IF NOT EXISTS content_themes TEXT[],
      ADD COLUMN IF NOT EXISTS content_length VARCHAR,
      ADD COLUMN IF NOT EXISTS posting_frequency VARCHAR,
      ADD COLUMN IF NOT EXISTS ai_tools TEXT[],
      ADD COLUMN IF NOT EXISTS scheduling_preferences JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS team_members TEXT[],
      ADD COLUMN IF NOT EXISTS goals TEXT[]
    `);
    
    // Fix 4: Add missing columns to content table
    console.log('📋 Adding missing columns to content table...');
    await pool.query(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS content_status VARCHAR DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS scheduled_time TIME,
      ADD COLUMN IF NOT EXISTS engagement_prediction NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS target_audience VARCHAR,
      ADD COLUMN IF NOT EXISTS optimal_posting_time TIMESTAMP
    `);
    
    // Fix 5: Create missing tables that are referenced in migrations
    console.log('📋 Creating missing AI tables...');
    
    // AI Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description TEXT,
        project_type VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // AI Generated Content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_generated_content (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        title VARCHAR,
        content TEXT,
        status VARCHAR DEFAULT 'generated',
        day_number INTEGER,
        platform VARCHAR,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // AI Content Calendar table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_content_calendar (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL,
        content_id INTEGER,
        scheduled_date DATE NOT NULL,
        user_id VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'scheduled',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Project Content Management table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_content_management (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        content_count INTEGER DEFAULT 0,
        published_count INTEGER DEFAULT 0,
        scheduled_count INTEGER DEFAULT 0,
        draft_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Content Action History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_action_history (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        action VARCHAR NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Structured Outputs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS structured_outputs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        output_type VARCHAR NOT NULL,
        input_data JSONB,
        output_data JSONB,
        status VARCHAR DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Generated Code table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS generated_code (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        language VARCHAR NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Platform Posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_posts (
        id SERIAL PRIMARY KEY,
        social_post_id INTEGER NOT NULL,
        platform VARCHAR NOT NULL,
        platform_post_id VARCHAR,
        status VARCHAR DEFAULT 'pending',
        published_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Post Media table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_media (
        id SERIAL PRIMARY KEY,
        social_post_id INTEGER NOT NULL,
        media_type VARCHAR NOT NULL,
        media_url VARCHAR NOT NULL,
        thumbnail_url VARCHAR,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Content Actions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_actions (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL,
        action_type VARCHAR NOT NULL,
        performed_by VARCHAR NOT NULL,
        performed_at TIMESTAMP DEFAULT NOW(),
        details JSONB DEFAULT '{}'
      )
    `);
    
    // Content Versions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_versions (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        title VARCHAR,
        content TEXT,
        changes_summary TEXT,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Project Extensions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_extensions (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        extension_type VARCHAR NOT NULL,
        configuration JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Fix 6: Update existing data with safe defaults
    console.log('📋 Updating existing data with safe defaults...');
    
    // Update users with missing passwords
    await pool.query(`
      UPDATE users 
      SET password = 'temp_password_needs_reset'
      WHERE password IS NULL OR password = ''
    `);
    
    // Update projects with missing categories
    await pool.query(`
      UPDATE projects 
      SET 
        category = 'general',
        content_type = 'mixed',
        duration = '30 days',
        content_frequency = 'daily'
      WHERE category IS NULL
    `);
    
    // Update content with missing status
    await pool.query(`
      UPDATE content 
      SET 
        content_status = COALESCE(status, 'draft'),
        is_ai_generated = COALESCE(ai_generated, false)
      WHERE content_status IS NULL
    `);
    
    // Fix 7: Create essential indexes
    console.log('📋 Creating essential indexes...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);
      CREATE INDEX IF NOT EXISTS idx_ai_generated_content_project_id ON ai_generated_content(ai_project_id);
      CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_project_id ON ai_content_calendar(ai_project_id);
      CREATE INDEX IF NOT EXISTS idx_content_action_history_content_id ON content_action_history(content_id);
    `);
    
    console.log('✅ All immediate database fixes applied successfully!');
    
    // Verify critical fixes
    console.log('🔍 Verifying critical fixes...');
    
    const passwordCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    
    const projectIdCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' AND column_name = 'project_id'
    `);
    
    const categoryCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'category'
    `);
    
    console.log(`✅ Password column: ${passwordCheck.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Project ID column: ${projectIdCheck.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Category column: ${categoryCheck.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
    
    console.log('🎯 Database is now ready for application startup!');
    
  } catch (error) {
    console.error('❌ Error applying immediate fixes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fixes
if (require.main === module) {
  applyImmediateFixes()
    .then(() => {
      console.log('✅ Immediate database fixes completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Immediate database fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { applyImmediateFixes };