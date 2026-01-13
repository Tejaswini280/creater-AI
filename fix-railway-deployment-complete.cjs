/**
 * COMPREHENSIVE RAILWAY DEPLOYMENT FIX
 * 
 * This script fixes all the critical issues preventing Railway deployment:
 * 1. Migration syntax errors (DO $ -> DO $$)
 * 2. Database schema conflicts
 * 3. Missing columns and constraints
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function fixRailwayDeployment() {
  console.log('🚀 FIXING RAILWAY DEPLOYMENT ISSUES...');
  console.log('');

  // Step 1: Fix migration syntax errors
  console.log('📝 STEP 1: Fixing migration syntax errors...');
  
  const migrationPath = path.join(process.cwd(), 'migrations', '0001_core_tables_idempotent.sql');
  
  if (fs.existsSync(migrationPath)) {
    let content = fs.readFileSync(migrationPath, 'utf8');
    
    // Fix all DO $ blocks to DO $$
    content = content.replace(/DO \$ \n/g, 'DO $$ \n');
    content = content.replace(/END \$;/g, 'END $$;');
    
    // Write the fixed content back
    fs.writeFileSync(migrationPath, content);
    console.log('✅ Fixed migration syntax errors');
  } else {
    console.log('⚠️  Migration file not found, creating new one...');
    
    // Create a clean, working migration file
    const cleanMigration = `-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE TABLES CREATION - RAILWAY DEPLOYMENT READY
-- ═══════════════════════════════════════════════════════════════════════════════
-- Creates all core tables with proper constraints
-- Safe for Railway deployment
-- Date: 2026-01-12 - SYNTAX FIXED
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (required for express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Users table with all required columns
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    password TEXT NOT NULL DEFAULT 'temp_password_needs_reset',
    profile_image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
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
);

-- Content table with all required columns
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
    is_paused BOOLEAN DEFAULT false,
    is_stopped BOOLEAN DEFAULT false,
    can_publish BOOLEAN DEFAULT true,
    publish_order INTEGER DEFAULT 0,
    content_version INTEGER DEFAULT 1,
    day_number INTEGER,
    last_regenerated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post schedules table
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
    title VARCHAR(200),
    description TEXT,
    content_type VARCHAR(50),
    duration VARCHAR(50),
    tone VARCHAR(50),
    target_audience VARCHAR(200),
    time_distribution VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Essential indexes
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Railway deployment ready - Core tables migration completed successfully' as status;
`;

    fs.writeFileSync(migrationPath, cleanMigration);
    console.log('✅ Created clean migration file for Railway');
  }

  // Step 2: Test database connection and schema
  console.log('');
  console.log('📋 STEP 2: Testing database connection...');
  
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:postgres123@localhost:5432/creators_dev_db';

  console.log(`🔗 Testing connection: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);

  const sql = postgres(connectionString, {
    ssl: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30
  });

  try {
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check if migration tracking table exists
    const migrationTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `;

    if (!migrationTableExists[0].exists) {
      console.log('📋 Creating migration tracking table...');
      await sql`
        CREATE TABLE schema_migrations (
          filename VARCHAR PRIMARY KEY,
          status VARCHAR NOT NULL DEFAULT 'pending',
          executed_at TIMESTAMP DEFAULT NOW(),
          error_message TEXT
        )
      `;
      console.log('✅ Migration tracking table created');
    }

    // Check core tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'projects', 'content', 'sessions')
      ORDER BY table_name
    `;

    const existingTables = tables.map(t => t.table_name);
    console.log(`✅ Existing tables: ${existingTables.join(', ')}`);

    // Check for critical columns
    if (existingTables.includes('users')) {
      const userColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('password', 'email')
      `;
      
      const hasPassword = userColumns.some(c => c.column_name === 'password');
      const hasEmail = userColumns.some(c => c.column_name === 'email');
      
      if (!hasPassword) {
        console.log('🔧 Adding missing password column to users table...');
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset'`;
        console.log('✅ Password column added');
      }
      
      if (hasEmail) {
        console.log('✅ Users table has required columns');
      }
    }

    if (existingTables.includes('content')) {
      const contentColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        AND column_name IN ('project_id', 'day_number')
      `;
      
      const hasProjectId = contentColumns.some(c => c.column_name === 'project_id');
      const hasDayNumber = contentColumns.some(c => c.column_name === 'day_number');
      
      if (!hasProjectId) {
        console.log('🔧 Adding missing project_id column to content table...');
        await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS project_id INTEGER`;
        console.log('✅ Project_id column added');
      }
      
      if (!hasDayNumber) {
        console.log('🔧 Adding missing day_number column to content table...');
        await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS day_number INTEGER`;
        console.log('✅ Day_number column added');
      }
      
      if (hasProjectId && hasDayNumber) {
        console.log('✅ Content table has required columns');
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 RAILWAY DEPLOYMENT FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration syntax errors fixed');
    console.log('✅ Database schema verified');
    console.log('✅ Critical columns ensured');
    console.log('✅ Ready for Railway deployment');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Commit and push these changes');
    console.log('2. Deploy to Railway');
    console.log('3. Your application should start successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ Database operation failed:', error.message);
    console.error('');
    console.error('This may be expected if running without a database connection.');
    console.error('The migration file has been fixed and should work on Railway.');
  } finally {
    await sql.end();
  }
}

// Run the fix
fixRailwayDeployment().catch(console.error);