const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Build connection string from environment variables
const buildConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const dbName = process.env.DB_NAME || "creators_dev_db";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "5432";

  // Handle empty password
  const passwordPart = dbPassword ? `:${dbPassword}` : '';
  return `postgresql://${dbUser}${passwordPart}@${dbHost}:${dbPort}/${dbName}`;
};

async function setupTables() {
  const connectionString = buildConnectionString();
  console.log('🔗 Connecting to database...');
  
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 30
  });

  try {
    console.log('📊 Setting up enhanced project workflow tables...');

    // Check if tables already exist
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'content', 'ai_projects', 'ai_generated_content')
    `;

    console.log(`📋 Found ${existingTables.length} existing tables`);

    // Create projects table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
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
        status VARCHAR NOT NULL DEFAULT 'active',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Projects table ready');

    // Create content table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        project_id INTEGER,
        title VARCHAR NOT NULL,
        description TEXT,
        script TEXT,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'draft',
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
    `;
    console.log('✅ Content table ready');

    // Create AI projects table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ai_projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
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
      )
    `;
    console.log('✅ AI Projects table ready');

    // Create AI generated content table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ai_generated_content (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
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
      )
    `;
    console.log('✅ AI Generated Content table ready');

    // Create AI content calendar table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ai_content_calendar (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        user_id VARCHAR NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        scheduled_time VARCHAR NOT NULL,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'scheduled',
        optimal_posting_time BOOLEAN DEFAULT false,
        engagement_score DECIMAL(3,2),
        ai_optimized BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ AI Content Calendar table ready');

    // Create engagement patterns table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
        id SERIAL PRIMARY KEY,
        platform VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        optimal_times TEXT[] NOT NULL,
        engagement_score DECIMAL(3,2),
        sample_size INTEGER DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ AI Engagement Patterns table ready');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id)`;
    console.log('✅ Database indexes created');

    // Insert sample engagement patterns
    const existingPatterns = await sql`SELECT COUNT(*) as count FROM ai_engagement_patterns`;
    if (existingPatterns[0].count === '0') {
      await sql`
        INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size) 
        VALUES 
          ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000),
          ('instagram', 'tech', ARRAY['10:00', '14:00', '19:00'], 0.82, 800),
          ('instagram', 'lifestyle', ARRAY['08:00', '13:00', '18:00'], 0.88, 1200),
          ('youtube', 'fitness', ARRAY['14:00', '20:00'], 0.90, 500),
          ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600),
          ('facebook', 'lifestyle', ARRAY['09:00', '15:00', '19:00'], 0.75, 900),
          ('tiktok', 'fitness', ARRAY['18:00', '20:00', '22:00'], 0.92, 1500),
          ('linkedin', 'business', ARRAY['08:00', '12:00', '17:00'], 0.78, 400)
      `;
      console.log('✅ Sample engagement patterns inserted');
    } else {
      console.log('📊 Engagement patterns already exist');
    }

    // Verify all tables
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'projects', 
        'content', 
        'ai_projects', 
        'ai_generated_content', 
        'ai_content_calendar',
        'ai_engagement_patterns'
      )
      ORDER BY table_name
    `;

    console.log('📊 Enhanced project workflow tables ready:');
    finalTables.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('🎉 Enhanced project workflow setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupTables().catch(console.error);