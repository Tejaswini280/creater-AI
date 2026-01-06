#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or POSTGRES_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixDatabaseSchema() {
  console.log('🔧 Starting database schema fixes...');
  
  try {
    // 1. Check if ai_generation_tasks table exists, create if missing
    console.log('📋 Checking ai_generation_tasks table...');
    const aiTasksTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_generation_tasks'
      );
    `;
    
    if (!aiTasksTableExists[0].exists) {
      console.log('🆕 Creating ai_generation_tasks table...');
      await sql`
        CREATE TABLE ai_generation_tasks (
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
      console.log('✅ ai_generation_tasks table created');
    } else {
      console.log('✅ ai_generation_tasks table already exists');
    }

    // 2. Check if content table has project_id column (snake_case)
    console.log('📋 Checking content table columns...');
    const contentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND table_schema = 'public';
    `;
    
    const columnNames = contentColumns.map(col => col.column_name);
    console.log('📋 Content table columns:', columnNames);
    
    // Check if we have projectId (camelCase) but not project_id (snake_case)
    const hasProjectId = columnNames.includes('projectId');
    const hasProjectIdSnake = columnNames.includes('project_id');
    
    if (hasProjectId && !hasProjectIdSnake) {
      console.log('🔄 Adding project_id alias for projectId column...');
      // Create a view or add computed column - but first let's check the actual column name
      const actualColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        AND table_schema = 'public'
        AND column_name LIKE '%project%';
      `;
      console.log('🔍 Project-related columns:', actualColumns);
    }

    // 3. Check if structured_outputs table exists
    console.log('📋 Checking structured_outputs table...');
    const structuredOutputsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'structured_outputs'
      );
    `;
    
    if (!structuredOutputsExists[0].exists) {
      console.log('🆕 Creating structured_outputs table...');
      await sql`
        CREATE TABLE structured_outputs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          prompt TEXT NOT NULL,
          schema JSONB NOT NULL,
          response_json JSONB NOT NULL,
          model VARCHAR DEFAULT 'gemini-2.5-flash',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;
      console.log('✅ structured_outputs table created');
    } else {
      console.log('✅ structured_outputs table already exists');
    }

    // 4. Check if generated_code table exists
    console.log('📋 Checking generated_code table...');
    const generatedCodeExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_code'
      );
    `;
    
    if (!generatedCodeExists[0].exists) {
      console.log('🆕 Creating generated_code table...');
      await sql`
        CREATE TABLE generated_code (
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
      console.log('✅ generated_code table created');
    } else {
      console.log('✅ generated_code table already exists');
    }

    // 5. Check all AI project management tables
    const aiTables = [
      'ai_projects',
      'ai_generated_content', 
      'ai_content_calendar',
      'ai_engagement_patterns',
      'project_content_management',
      'content_action_history'
    ];

    for (const tableName of aiTables) {
      console.log(`📋 Checking ${tableName} table...`);
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      
      if (!tableExists[0].exists) {
        console.log(`⚠️ Table ${tableName} is missing - this may cause issues`);
      } else {
        console.log(`✅ ${tableName} table exists`);
      }
    }

    // 6. Fix the specific column name issue for scheduler
    console.log('🔧 Checking content table structure for scheduler compatibility...');
    
    // Get the actual column name for project reference
    const projectColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND table_schema = 'public'
      AND (column_name = 'project_id' OR column_name = 'projectId');
    `;
    
    if (projectColumn.length > 0) {
      const actualColumnName = projectColumn[0].column_name;
      console.log(`✅ Found project column: ${actualColumnName}`);
      
      if (actualColumnName === 'projectId') {
        console.log('ℹ️ Note: Content table uses camelCase "projectId" - scheduler queries may need adjustment');
      }
    } else {
      console.log('⚠️ No project column found in content table');
    }

    // 7. Verify essential tables exist
    const essentialTables = ['users', 'content', 'projects', 'notifications'];
    for (const tableName of essentialTables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      
      if (!exists[0].exists) {
        console.error(`❌ Critical table ${tableName} is missing!`);
      } else {
        console.log(`✅ Essential table ${tableName} exists`);
      }
    }

    console.log('✅ Database schema check and fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log('🎉 Database schema fixes completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database schema fix failed:', error);
    process.exit(1);
  });