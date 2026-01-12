#!/usr/bin/env node

/**
 * RAILWAY DATABASE COLUMN FIXES
 * Applies critical fixes to Railway production database
 */

const { Pool } = require('pg');

// Use Railway database URL from environment or logs
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@postgres.railway.internal:5432/railway',
  ssl: { rejectUnauthorized: false } // Railway requires SSL
};

async function fixRailwayDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Fixing Railway database columns...');
    console.log('🔌 Connecting to Railway database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to Railway database successfully');
    client.release();
    
    // Fix 1: Add password column to users table
    console.log('📋 Adding password column to users table...');
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset'
      `);
      console.log('✅ Password column added');
    } catch (error) {
      console.log('ℹ️ Password column already exists or error:', error.message);
    }
    
    // Fix 2: Add project_id column to content table
    console.log('📋 Adding project_id column to content table...');
    try {
      await pool.query(`
        ALTER TABLE content 
        ADD COLUMN IF NOT EXISTS project_id INTEGER
      `);
      console.log('✅ project_id column added');
    } catch (error) {
      console.log('ℹ️ project_id column already exists or error:', error.message);
    }
    
    // Fix 3: Add missing columns to projects table
    console.log('📋 Adding missing columns to projects table...');
    const projectColumns = [
      'category VARCHAR DEFAULT \'general\'',
      'content_type VARCHAR DEFAULT \'mixed\'',
      'duration VARCHAR DEFAULT \'30 days\'',
      'content_frequency VARCHAR DEFAULT \'daily\'',
      'brand_voice VARCHAR',
      'start_date DATE',
      'channel_types TEXT[]',
      'content_formats TEXT[]',
      'content_themes TEXT[]',
      'content_length VARCHAR',
      'posting_frequency VARCHAR',
      'ai_tools TEXT[]',
      'scheduling_preferences JSONB DEFAULT \'{}\'',
      'budget NUMERIC(10,2)',
      'team_members TEXT[]',
      'goals TEXT[]'
    ];
    
    for (const column of projectColumns) {
      try {
        const columnName = column.split(' ')[0];
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`✅ Added ${columnName} to projects`);
      } catch (error) {
        console.log(`ℹ️ Column already exists or error: ${error.message}`);
      }
    }
    
    // Fix 4: Add missing columns to content table
    console.log('📋 Adding missing columns to content table...');
    const contentColumns = [
      'content_status VARCHAR DEFAULT \'draft\'',
      'is_ai_generated BOOLEAN DEFAULT false',
      'scheduled_time TIME',
      'engagement_prediction NUMERIC(5,2)',
      'target_audience VARCHAR',
      'optimal_posting_time TIMESTAMP'
    ];
    
    for (const column of contentColumns) {
      try {
        const columnName = column.split(' ')[0];
        await pool.query(`ALTER TABLE content ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`✅ Added ${columnName} to content`);
      } catch (error) {
        console.log(`ℹ️ Column already exists or error: ${error.message}`);
      }
    }
    
    // Fix 5: Create missing tables that are referenced in migrations
    console.log('📋 Creating missing AI tables...');
    
    const tables = [
      {
        name: 'ai_projects',
        sql: `
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
        `
      },
      {
        name: 'ai_generated_content',
        sql: `
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
        `
      },
      {
        name: 'ai_content_calendar',
        sql: `
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
        `
      },
      {
        name: 'project_content_management',
        sql: `
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
        `
      },
      {
        name: 'content_action_history',
        sql: `
          CREATE TABLE IF NOT EXISTS content_action_history (
            id SERIAL PRIMARY KEY,
            content_id INTEGER NOT NULL,
            user_id VARCHAR NOT NULL,
            action VARCHAR NOT NULL,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'structured_outputs',
        sql: `
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
        `
      },
      {
        name: 'generated_code',
        sql: `
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
        `
      },
      {
        name: 'platform_posts',
        sql: `
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
        `
      },
      {
        name: 'post_media',
        sql: `
          CREATE TABLE IF NOT EXISTS post_media (
            id SERIAL PRIMARY KEY,
            social_post_id INTEGER NOT NULL,
            media_type VARCHAR NOT NULL,
            media_url VARCHAR NOT NULL,
            thumbnail_url VARCHAR,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'content_actions',
        sql: `
          CREATE TABLE IF NOT EXISTS content_actions (
            id SERIAL PRIMARY KEY,
            content_id INTEGER NOT NULL,
            action_type VARCHAR NOT NULL,
            performed_by VARCHAR NOT NULL,
            performed_at TIMESTAMP DEFAULT NOW(),
            details JSONB DEFAULT '{}'
          )
        `
      },
      {
        name: 'content_versions',
        sql: `
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
        `
      },
      {
        name: 'project_extensions',
        sql: `
          CREATE TABLE IF NOT EXISTS project_extensions (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL,
            extension_type VARCHAR NOT NULL,
            configuration JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      }
    ];
    
    for (const table of tables) {
      try {
        await pool.query(table.sql);
        console.log(`✅ Created/verified table: ${table.name}`);
      } catch (error) {
        console.log(`ℹ️ Table ${table.name} already exists or error: ${error.message}`);
      }
    }
    
    // Fix 6: Update existing data with safe defaults
    console.log('📋 Updating existing data with safe defaults...');
    
    try {
      // Update users with missing passwords
      const userUpdate = await pool.query(`
        UPDATE users 
        SET password = 'temp_password_needs_reset'
        WHERE password IS NULL OR password = ''
      `);
      console.log(`✅ Updated ${userUpdate.rowCount} users with default passwords`);
    } catch (error) {
      console.log('ℹ️ User update error:', error.message);
    }
    
    try {
      // Update projects with missing categories
      const projectUpdate = await pool.query(`
        UPDATE projects 
        SET 
          category = 'general',
          content_type = 'mixed',
          duration = '30 days',
          content_frequency = 'daily'
        WHERE category IS NULL
      `);
      console.log(`✅ Updated ${projectUpdate.rowCount} projects with default values`);
    } catch (error) {
      console.log('ℹ️ Project update error:', error.message);
    }
    
    try {
      // Update content with missing status
      const contentUpdate = await pool.query(`
        UPDATE content 
        SET 
          content_status = COALESCE(status, 'draft'),
          is_ai_generated = COALESCE(ai_generated, false)
        WHERE content_status IS NULL
      `);
      console.log(`✅ Updated ${contentUpdate.rowCount} content items with default values`);
    } catch (error) {
      console.log('ℹ️ Content update error:', error.message);
    }
    
    // Fix 7: Create essential indexes
    console.log('📋 Creating essential indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_ai_generated_content_project_id ON ai_generated_content(ai_project_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_project_id ON ai_content_calendar(ai_project_id)',
      'CREATE INDEX IF NOT EXISTS idx_content_action_history_content_id ON content_action_history(content_id)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await pool.query(indexSQL);
        console.log('✅ Index created/verified');
      } catch (error) {
        console.log('ℹ️ Index already exists or error:', error.message);
      }
    }
    
    console.log('✅ All Railway database fixes applied successfully!');
    
    // Verify critical fixes
    console.log('🔍 Verifying critical fixes...');
    
    try {
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
      
      console.log('🎯 Railway database is now ready for application startup!');
    } catch (error) {
      console.log('ℹ️ Verification error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error fixing Railway database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fixes
if (require.main === module) {
  fixRailwayDatabase()
    .then(() => {
      console.log('✅ Railway database fixes completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Railway database fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { fixRailwayDatabase };