const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'creators_dev_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function setupAIDatabase() {
  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL database');

    // Create database if it doesn't exist
    try {
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'creators_dev_db'}`);
      console.log('✅ Database created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Database already exists');
      } else {
        console.log('⚠️ Database creation error (might already exist):', error.message);
      }
    }

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table ready');

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Projects table ready');

    // Create content table with AI fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
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
        metadata JSONB DEFAULT '{}',
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
    `);
    console.log('✅ Content table ready');

    // Create AI generation tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_generation_tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_type VARCHAR NOT NULL,
        prompt TEXT NOT NULL,
        result TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    console.log('✅ AI generation tasks table ready');

    // Create AI projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        project_type VARCHAR NOT NULL,
        duration INTEGER NOT NULL,
        custom_duration INTEGER,
        target_channels TEXT[],
        content_frequency VARCHAR,
        target_audience TEXT,
        brand_voice TEXT,
        content_goals TEXT[],
        content_title TEXT,
        content_description TEXT,
        channel_type TEXT[],
        tags TEXT[],
        ai_settings JSONB DEFAULT '{}',
        status VARCHAR DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ AI projects table ready');

    // Create AI generated content table
    await client.query(`
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
        metadata JSONB DEFAULT '{}',
        ai_model VARCHAR DEFAULT 'gemini-2.5-flash',
        generation_prompt TEXT,
        confidence DECIMAL(5,2),
        engagement_prediction JSONB DEFAULT '{}',
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
    `);
    console.log('✅ AI generated content table ready');

    // Create AI content calendar table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_content_calendar (
        id SERIAL PRIMARY KEY,
        ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
        content_id INTEGER REFERENCES ai_generated_content(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME,
        platform VARCHAR NOT NULL,
        content_type VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'scheduled',
        optimal_posting_time TIME,
        engagement_score DECIMAL(5,2),
        ai_optimized BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ AI content calendar table ready');

    // Create AI engagement patterns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
        id SERIAL PRIMARY KEY,
        platform VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        optimal_times TIME[],
        engagement_score DECIMAL(5,2),
        sample_size INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform, category)
      )
    `);
    console.log('✅ AI engagement patterns table ready');

    // Create AI agents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        capabilities TEXT[],
        status VARCHAR DEFAULT 'idle',
        performance JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ AI agents table ready');

    // Create AI workflows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_workflows (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        config JSONB DEFAULT '{}',
        status VARCHAR DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        result TEXT,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log('✅ AI workflows table ready');

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_projects_user_status ON ai_projects(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_ai_generated_content_project ON ai_generated_content(ai_project_id, day_number)',
      'CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_status ON ai_generated_content(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_date ON ai_content_calendar(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_content_user_created_status ON content(user_id, created_at, status)',
      'CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_created ON ai_generation_tasks(user_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_ai_agents_user_status ON ai_agents(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_status ON ai_workflows(user_id, status)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log('⚠️ Index creation warning:', error.message);
      }
    }
    console.log('✅ Database indexes ready');

    // Insert default engagement patterns
    const defaultPatterns = [
      {
        platform: 'instagram',
        category: 'general',
        optimal_times: ['{09:00:00,12:00:00,15:00:00,18:00:00,21:00:00}'],
        engagement_score: 75.5
      },
      {
        platform: 'youtube',
        category: 'general',
        optimal_times: ['{14:00:00,18:00:00,20:00:00}'],
        engagement_score: 68.2
      },
      {
        platform: 'tiktok',
        category: 'general',
        optimal_times: ['{06:00:00,09:00:00,12:00:00,19:00:00,21:00:00}'],
        engagement_score: 82.1
      }
    ];

    for (const pattern of defaultPatterns) {
      try {
        await client.query(`
          INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size)
          VALUES ($1, $2, $3, $4, 1000)
          ON CONFLICT (platform, category) DO NOTHING
        `, [pattern.platform, pattern.category, pattern.optimal_times, pattern.engagement_score]);
      } catch (error) {
        console.log('⚠️ Pattern insertion warning:', error.message);
      }
    }
    console.log('✅ Default engagement patterns ready');

    // Create a test user if none exists
    try {
      const userResult = await client.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(userResult.rows[0].count);
      
      if (userCount === 0) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await client.query(`
          INSERT INTO users (id, email, first_name, last_name) VALUES ('test-user-oauth-ai', 'test@creatornexus.dev', 'OAuth', 'TestUser')
        `, [hashedPassword]);
        
        console.log('✅ Test user created (email: test@example.com, password: password123)');
      }
    } catch (error) {
      console.log('⚠️ Test user creation warning:', error.message);
    }

    console.log('\n🎉 AI Database setup completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('- Users table with authentication');
    console.log('- Projects and content management');
    console.log('- AI generation tasks tracking');
    console.log('- AI projects with advanced settings');
    console.log('- AI generated content storage');
    console.log('- AI content calendar optimization');
    console.log('- AI engagement patterns');
    console.log('- AI agents management');
    console.log('- AI workflows orchestration');
    console.log('- Performance indexes');
    console.log('- Default engagement patterns');
    
    console.log('\n🔑 Test Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Database setup error:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
setupAIDatabase().catch(console.error);