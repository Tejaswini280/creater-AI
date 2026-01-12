const { Client } = require('pg');

async function setupDatabase() {
  console.log('🗄️  Setting up CreatorNexus database...');
  
  // Connect to PostgreSQL server (not specific database)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '', // Empty password as per .env
    database: 'postgres' // Connect to default postgres database first
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'creators_dev_db'"
    );
    
    if (dbCheckResult.rows.length === 0) {
      // Create database
      console.log('📦 Creating creators_dev_db database...');
      await client.query('CREATE DATABASE creators_dev_db');
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }
    
    await client.end();
    
    // Now connect to the specific database to create tables
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'creators_dev_db'
    });
    
    await dbClient.connect();
    console.log('✅ Connected to creators_dev_db');
    
    // Create basic tables if they don't exist
    console.log('📋 Creating basic tables...');
    
    // Users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name VARCHAR NOT NULL,
        last_name VARCHAR NOT NULL,
        profile_image_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Sessions table (required for authentication)
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    
    // Content table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    `);
    
    // Projects table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        niche VARCHAR,
        target_audience TEXT,
        content_pillars TEXT[],
        brand_voice VARCHAR,
        posting_schedule JSONB,
        platforms TEXT[],
        status VARCHAR DEFAULT 'active',
        total_days INTEGER DEFAULT 30,
        content_per_day INTEGER DEFAULT 1,
        current_day INTEGER DEFAULT 1,
        is_paused BOOLEAN DEFAULT false,
        is_stopped BOOLEAN DEFAULT false,
        can_publish_unpublished BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Basic tables created successfully');
    
    // Create a test user if none exists
    const userCheck = await dbClient.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('👤 Creating passwordless test user (OAuth system)...');
      await dbClient.query(`
        INSERT INTO users (id, email, first_name, last_name)
        VALUES ('test-user-oauth-db', 'test@creatornexus.dev', 'OAuth', 'TestUser')
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Test user created (email: test@creatornexus.com, password: password)');
    }
    
    await dbClient.end();
    console.log('✅ Database setup completed successfully');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();