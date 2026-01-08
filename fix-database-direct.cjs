#!/usr/bin/env node

/**
 * Direct Database Schema Fix
 * This script connects directly to your Railway database and fixes schema issues
 */

const postgres = require('postgres');

// Use the DATABASE_URL from your Railway deployment logs
const DATABASE_URL = 'postgresql://postgres:***@postgres.railway.internal:5432/railway';

console.log('🔧 Connecting to Railway database...');

// Create connection with Railway-specific settings
const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function fixDatabaseSchema() {
  try {
    console.log('📋 Starting database schema fix...');

    // 1. Add missing project_id column to content table
    console.log('🔧 Adding project_id column to content table...');
    await sql`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS project_id INTEGER;
    `;
    console.log('✅ Added project_id column');

    // 2. Create projects table if missing
    console.log('🔧 Creating projects table...');
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

    // 3. Add foreign key constraint for project_id
    console.log('🔧 Adding foreign key constraint...');
    await sql`
      ALTER TABLE content 
      ADD CONSTRAINT IF NOT EXISTS fk_content_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    `;
    console.log('✅ Added foreign key constraint');

    // 4. Create content_metrics table if missing
    console.log('🔧 Creating content_metrics table...');
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

    // 5. Create ai_generation_tasks table if missing
    console.log('🔧 Creating ai_generation_tasks table...');
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

    // 6. Add missing columns to content table
    console.log('🔧 Adding missing columns to content table...');
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

    // 7. Create indexes for better performance
    console.log('🔧 Creating database indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
      CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number);
      CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    `;
    console.log('✅ Created database indexes');

    // 8. Verify the fix
    console.log('🔍 Verifying database schema...');
    const contentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      ORDER BY ordinal_position;
    `;
    
    const hasProjectId = contentColumns.some(col => col.column_name === 'project_id');
    if (hasProjectId) {
      console.log('✅ project_id column exists in content table');
    } else {
      console.log('❌ project_id column still missing!');
    }

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('content_metrics', 'ai_generation_tasks', 'projects')
      ORDER BY table_name;
    `;
    
    console.log('✅ Verified tables:', tables.map(t => t.table_name));

    console.log('🎉 Database schema fix completed successfully!');
    console.log('✅ Your Railway application should now work properly');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await fixDatabaseSchema();
  } catch (error) {
    console.error('💥 Schema fix failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();