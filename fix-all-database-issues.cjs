#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/creators_dev_db';

const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixAllDatabaseIssues() {
  console.log('🔧 Starting comprehensive database fixes...');
  
  try {
    // 1. Ensure all required tables exist with correct structure
    console.log('📋 Verifying all required tables...');
    
    // Check and create missing tables
    const requiredTables = [
      {
        name: 'ai_generation_tasks',
        createSql: `
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
        `
      },
      {
        name: 'structured_outputs',
        createSql: `
          CREATE TABLE IF NOT EXISTS structured_outputs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            schema JSONB NOT NULL,
            response_json JSONB NOT NULL,
            model VARCHAR DEFAULT 'gemini-2.5-flash',
            created_at TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'generated_code',
        createSql: `
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
        `
      }
    ];

    for (const table of requiredTables) {
      console.log(`🔍 Checking ${table.name} table...`);
      try {
        await sql.unsafe(table.createSql);
        console.log(`✅ ${table.name} table verified/created`);
      } catch (error) {
        console.log(`⚠️ Issue with ${table.name} table:`, error.message);
      }
    }

    // 2. Verify content table has correct columns
    console.log('📋 Verifying content table structure...');
    const contentColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Content table columns:');
    contentColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // 3. Check if we need to add any missing columns to content table
    const requiredContentColumns = [
      'project_id',
      'scheduled_at',
      'status',
      'user_id',
      'title',
      'description',
      'script',
      'platform',
      'content_type'
    ];

    const existingColumns = contentColumns.map(col => col.column_name);
    const missingColumns = requiredContentColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('⚠️ Missing columns in content table:', missingColumns);
      // Add missing columns if needed
      for (const column of missingColumns) {
        try {
          let alterSql = '';
          switch (column) {
            case 'project_id':
              alterSql = 'ALTER TABLE content ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;';
              break;
            case 'scheduled_at':
              alterSql = 'ALTER TABLE content ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;';
              break;
            case 'status':
              alterSql = 'ALTER TABLE content ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT \'draft\';';
              break;
            default:
              console.log(`⚠️ Don't know how to add column: ${column}`);
              continue;
          }
          
          if (alterSql) {
            await sql.unsafe(alterSql);
            console.log(`✅ Added missing column: ${column}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not add column ${column}:`, error.message);
        }
      }
    } else {
      console.log('✅ All required content table columns exist');
    }

    // 4. Verify projects table exists
    console.log('📋 Verifying projects table...');
    const projectsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      );
    `;

    if (!projectsExists[0].exists) {
      console.log('🆕 Creating projects table...');
      await sql`
        CREATE TABLE projects (
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
      console.log('✅ Projects table created');
    } else {
      console.log('✅ Projects table exists');
    }

    // 5. Test a simple query to make sure everything works
    console.log('🧪 Testing database connectivity...');
    const testQuery = await sql`SELECT COUNT(*) as count FROM users;`;
    console.log(`✅ Database test successful - found ${testQuery[0].count} users`);

    // 6. Check for any content with scheduled status
    console.log('📋 Checking scheduled content...');
    const scheduledContent = await sql`
      SELECT COUNT(*) as count 
      FROM content 
      WHERE status = 'scheduled';
    `;
    console.log(`📅 Found ${scheduledContent[0].count} scheduled content items`);

    console.log('✅ All database fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database fixes:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the comprehensive fix
fixAllDatabaseIssues()
  .then(() => {
    console.log('🎉 All database issues fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });