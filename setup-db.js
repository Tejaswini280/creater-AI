import pg from 'pg';
const { Client } = pg;

// Database connection configuration
const config = {
  host: 'localhost',
  port: 5432,
  database: 'creatornexus',
  user: 'postgres',
  password: process.argv[2] || 'your_postgres_password' // Get password from command line argument
};

async function setupDatabase() {
  const client = new Client(config);
  
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');
    
    // Create tables
    console.log('Creating tables...');
    
    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name VARCHAR NOT NULL,
        last_name VARCHAR NOT NULL,
        profile_image_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Social accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR NOT NULL,
        account_id VARCHAR NOT NULL,
        account_name VARCHAR NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Projects table
    await client.query(`
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
    `);
    
    // Content table
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
        metadata JSONB,
        ai_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Content metrics table
    await client.query(`
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
    `);
    
    // Niches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS niches (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        category VARCHAR NOT NULL,
        trend_score INTEGER DEFAULT 0,
        difficulty VARCHAR NOT NULL,
        profitability VARCHAR NOT NULL,
        keywords TEXT[],
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // AI generation tasks table
    await client.query(`
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
    `);
    
    console.log('All tables created successfully!');
    
    // Test insert a sample user
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O', // password: test123
      first_name: 'Test',
      last_name: 'User'
    };
    
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [testUser.id, testUser.email, testUser.password, testUser.first_name, testUser.last_name]);
    
    console.log('Sample user created (email: test@example.com, password: test123)');
    
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

setupDatabase(); 