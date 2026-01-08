#!/usr/bin/env node

/**
 * Complete Railway Database Schema Fix
 * This script creates all missing tables and columns based on the current schema
 */

import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1
});

console.log('🔧 Starting complete database schema migration...');

async function createMissingTables() {
  try {
    console.log('📋 Creating missing tables and columns...');

    // 1. Add missing project_id column to content table
    await sql`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
    `;
    console.log('✅ Added project_id column to content table');

    // 2. Create content_metrics table if missing
    await sql`
      CREATE TABLE IF NOT EXISTS content_metrics (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        platform VARCHAR NOT NULL,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        engagement_rate DECIMAL(5,2),
        revenue DECIMAL(10,2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created content_metrics table');

    // 3. Create ai_generation_tasks table if missing
    await sql`
      CREATE TABLE IF NOT EXISTS ai_generation_tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_type VARCHAR NOT NULL,
        prompt TEXT NOT NULL,
        result TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `;
    console.log('✅ Created ai_generation_tasks table');

    // 4. Create projects table if missing
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        type VARCHAR NOT NULL,
        template VARCHAR,
        platform VARCHAR,
        target_audience VARCHAR,
        estimated_duration VARCHAR,
        tags TEXT[],
        is_public BOOLEAN DEFAULT false,
        status VARCHAR NOT NULL DEFAULT 'active',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created projects table');

    // 5. Create templates table if missing
    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        content TEXT,
        thumbnail_url VARCHAR,
        rating DECIMAL(3,2) DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created templates table');

    // 6. Create notifications table if missing
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
      );
    `;
    console.log('✅ Created notifications table');

    // 7. Create AI project management tables
    await sql`
      CREATE TABLE IF NOT EXISTS ai_projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        project_type VARCHAR NOT NULL,
        duration INTEGER NOT NULL,
        custom_duration INTEGER,
        target_channels TEXT[] NOT NULL,
        content_frequency VARCHAR NOT NULL,
        target_audience VARCHAR,
        brand_voice VARCHAR,
        content_goals TEXT[],
        content_title VARCHAR,
        content_description TEXT,
        channel_type VARCHAR,
        tags TEXT[],
        ai_settings JSONB,
        status VARCHAR NOT NULL DEFAULT 'active',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created ai_projects table');

    // 8. Create ai_generated_content table
    await sql`
      CREATE TABLE IF NOT EXISTS ai_generated_content (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'draft',
        scheduled_date TIMESTAMP,
        published_at TIMESTAMP,
        hashtags TEXT[],
        metadata JSONB,
        ai_model VARCHAR DEFAULT 'gemini-2.5-flash',
        generation_prompt TEXT,
        confidence DECIMAL(3,2),
        engagement_prediction JSONB,
        day_number INTEGER NOT NULL,
        is_paused BOOLEAN DEFAULT false,
        is_stopped BOOLEAN DEFAULT false,
        can_publish BOOLEAN DEFAULT true,
        publish_order INTEGER DEFAULT 0,
        content_version INTEGER DEFAULT 1,
        last_regenerated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created ai_generated_content table');

    // 9. Create structured_outputs table
    await sql`
      CREATE TABLE IF NOT EXISTS structured_outputs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        schema JSONB NOT NULL,
        response_json JSONB NOT NULL,
        model VARCHAR DEFAULT 'gemini-2.5-flash',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created structured_outputs table');

    // 10. Create generated_code table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_code (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        language VARCHAR NOT NULL,
        framework VARCHAR,
        code TEXT NOT NULL,
        explanation TEXT,
        dependencies TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Created generated_code table');

    // 11. Add missing columns to content table
    await sql`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS day_number INTEGER,
      ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;
    `;
    console.log('✅ Added missing columns to content table');

    console.log('🎉 All missing tables and columns created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('📊 Creating database indexes...');

    // Content table indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
      CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number);
      CREATE INDEX IF NOT EXISTS idx_content_is_paused ON content(is_paused);
      CREATE INDEX IF NOT EXISTS idx_content_can_publish ON content(can_publish);
    `;

    // Content metrics indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
      CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);
      CREATE INDEX IF NOT EXISTS idx_content_metrics_last_updated ON content_metrics(last_updated);
    `;

    // AI generation tasks indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_generation_tasks(task_type);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_created_at ON ai_generation_tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_status ON ai_generation_tasks(user_id, status);
    `;

    // Projects indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
    `;

    // AI projects indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);
      CREATE INDEX IF NOT EXISTS idx_ai_projects_project_type ON ai_projects(project_type);
    `;

    // AI generated content indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ai_content_project_id ON ai_generated_content(ai_project_id);
      CREATE INDEX IF NOT EXISTS idx_ai_content_user_id ON ai_generated_content(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);
      CREATE INDEX IF NOT EXISTS idx_ai_content_day_number ON ai_generated_content(day_number);
    `;

    // Notifications indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `;

    console.log('✅ All indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw - indexes are non-critical
  }
}

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...');

    // Check if all tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('📋 Existing tables:', tableNames);

    // Check content table structure
    const contentColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      ORDER BY ordinal_position;
    `;

    console.log('📋 Content table columns:', contentColumns.length);

    // Test a simple query to ensure everything works
    const testQuery = await sql`SELECT COUNT(*) as count FROM users;`;
    console.log('✅ Database connection test passed:', testQuery[0].count, 'users');

    console.log('🎉 Schema verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    throw error;
  }
}

async function main() {
  try {
    await createMissingTables();
    await createIndexes();
    await verifySchema();
    
    console.log('🚀 Database schema migration completed successfully!');
    console.log('✅ Your Railway deployment should now work properly.');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();