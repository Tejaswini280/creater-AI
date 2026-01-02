import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function checkAITables() {
  console.log('🔍 Checking AI-related database tables and columns...');
  
  try {
    // Check if ai_generation_tasks table exists and has all required columns
    console.log('\n📋 Checking ai_generation_tasks table...');
    const aiTasksResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_generation_tasks' 
      ORDER BY ordinal_position;
    `);
    
    if (aiTasksResult.length === 0) {
      console.log('❌ ai_generation_tasks table does not exist');
      return false;
    } else {
      console.log('✅ ai_generation_tasks table exists with columns:');
      aiTasksResult.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Check if ai_generated_content table exists
    console.log('\n📋 Checking ai_generated_content table...');
    const aiContentResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_generated_content' 
      ORDER BY ordinal_position;
    `);
    
    if (aiContentResult.length === 0) {
      console.log('❌ ai_generated_content table does not exist - this table is needed for advanced AI content management');
    } else {
      console.log('✅ ai_generated_content table exists with columns:');
      aiContentResult.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Check if ai_projects table exists
    console.log('\n📋 Checking ai_projects table...');
    const aiProjectsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_projects' 
      ORDER BY ordinal_position;
    `);
    
    if (aiProjectsResult.length === 0) {
      console.log('❌ ai_projects table does not exist - this table is needed for AI project management');
    } else {
      console.log('✅ ai_projects table exists with columns:');
      aiProjectsResult.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Check if ai_content_calendar table exists
    console.log('\n📋 Checking ai_content_calendar table...');
    const aiCalendarResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ai_content_calendar' 
      ORDER BY ordinal_position;
    `);
    
    if (aiCalendarResult.length === 0) {
      console.log('❌ ai_content_calendar table does not exist - this table is needed for AI content scheduling');
    } else {
      console.log('✅ ai_content_calendar table exists');
    }

    // Check if content table has AI-related columns
    console.log('\n📋 Checking content table for AI-related columns...');
    const contentResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name IN ('ai_generated', 'day_number', 'is_paused', 'is_stopped', 'can_publish', 'publish_order', 'content_version', 'last_regenerated_at')
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Content table AI-related columns:');
    contentResult.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check missing columns in content table
    const requiredContentColumns = [
      'ai_generated', 'day_number', 'is_paused', 'is_stopped', 
      'can_publish', 'publish_order', 'content_version', 'last_regenerated_at'
    ];
    
    const existingColumns = contentResult.map(col => col.column_name);
    const missingColumns = requiredContentColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns in content table:', missingColumns);
    }

    console.log('\n🎯 Summary:');
    console.log('- ai_generation_tasks: ✅ EXISTS');
    console.log('- ai_generated_content:', aiContentResult.length > 0 ? '✅ EXISTS' : '❌ MISSING');
    console.log('- ai_projects:', aiProjectsResult.length > 0 ? '✅ EXISTS' : '❌ MISSING');
    console.log('- ai_content_calendar:', aiCalendarResult.length > 0 ? '✅ EXISTS' : '❌ MISSING');
    console.log('- content table AI columns:', missingColumns.length === 0 ? '✅ COMPLETE' : `❌ MISSING: ${missingColumns.join(', ')}`);

    return {
      hasAITasks: aiTasksResult.length > 0,
      hasAIContent: aiContentResult.length > 0,
      hasAIProjects: aiProjectsResult.length > 0,
      hasAICalendar: aiCalendarResult.length > 0,
      missingContentColumns: missingColumns
    };

  } catch (error) {
    console.error('❌ Error checking AI tables:', error);
    return false;
  }
}

async function createMissingAITables() {
  console.log('\n🔧 Creating missing AI tables...');
  
  try {
    // Create ai_projects table if missing
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        niche VARCHAR NOT NULL,
        target_audience VARCHAR NOT NULL,
        content_pillars TEXT[] DEFAULT '{}',
        posting_schedule JSONB,
        duration_days INTEGER NOT NULL DEFAULT 30,
        platforms VARCHAR[] DEFAULT '{}',
        status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
        ai_model VARCHAR DEFAULT 'gemini-1.5-flash',
        generation_settings JSONB,
        engagement_goals JSONB,
        brand_voice VARCHAR,
        content_themes TEXT[] DEFAULT '{}',
        hashtag_strategy JSONB,
        performance_metrics JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ ai_projects table created/verified');

    // Create ai_generated_content table if missing
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_generated_content (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'paused', 'stopped')),
        scheduled_date TIMESTAMP,
        published_at TIMESTAMP,
        hashtags TEXT[] DEFAULT '{}',
        metadata JSONB,
        ai_model VARCHAR DEFAULT 'gemini-1.5-flash',
        generation_prompt TEXT,
        confidence DECIMAL(3, 2),
        engagement_prediction JSONB,
        day_number INTEGER NOT NULL,
        is_paused BOOLEAN DEFAULT FALSE,
        is_stopped BOOLEAN DEFAULT FALSE,
        can_publish BOOLEAN DEFAULT TRUE,
        publish_order INTEGER DEFAULT 0,
        content_version INTEGER DEFAULT 1,
        last_regenerated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ ai_generated_content table created/verified');

    // Create ai_content_calendar table if missing
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_content_calendar (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
        content_id INTEGER NOT NULL REFERENCES ai_generated_content(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_date TIMESTAMP NOT NULL,
        scheduled_time VARCHAR NOT NULL,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
        optimal_posting_time BOOLEAN DEFAULT FALSE,
        engagement_score DECIMAL(3, 2),
        ai_optimized BOOLEAN DEFAULT TRUE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ ai_content_calendar table created/verified');

    // Add missing columns to content table
    await db.execute(sql`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS day_number INTEGER,
      ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;
    `);
    console.log('✅ Content table AI columns added/verified');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_ai_projects_user_status ON ai_projects(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_ai_generated_content_project ON ai_generated_content(ai_project_id, day_number);
      CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_status ON ai_generated_content(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_date ON ai_content_calendar(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_content_user_created_status ON content(user_id, created_at, status);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_user_active ON social_accounts(user_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_created ON ai_generation_tasks(user_id, created_at);
    `);
    console.log('✅ Database indexes created successfully');

    // Apply slow query optimizations
    await db.execute(sql`
      -- Optimize content queries
      CREATE INDEX IF NOT EXISTS idx_content_project_day ON content(project_id, day_number) WHERE day_number IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;
      
      -- Optimize AI task queries  
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_created ON ai_generation_tasks(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_tasks_type_user ON ai_generation_tasks(task_type, user_id);
      
      -- Optimize notification queries
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);
      
      -- Optimize social posts queries
      CREATE INDEX IF NOT EXISTS idx_social_posts_user_status ON social_posts(user_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_social_posts_project_type ON social_posts(project_id, content_type);
    `);
    console.log('✅ Slow query optimizations applied');

    console.log('\n🎉 All AI-related tables and columns have been created/verified successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error creating AI tables:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting AI database schema verification...\n');
  
  const status = await checkAITables();
  
  if (status && (
    !status.hasAIContent || 
    !status.hasAIProjects || 
    !status.hasAICalendar || 
    status.missingContentColumns.length > 0
  )) {
    console.log('\n🔧 Some AI tables/columns are missing. Creating them...');
    await createMissingAITables();
  } else if (status) {
    console.log('\n✅ All AI tables and columns are present!');
  }
  
  // Final verification
  console.log('\n🔍 Final verification...');
  await checkAITables();
  
  console.log('\n✅ AI database schema check completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});