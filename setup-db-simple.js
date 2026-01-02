import pg from 'pg';
const { Client } = pg;

// Try different database connection configurations
const configs = [
  {
    host: 'localhost',
    port: 5432,
    database: 'creatornexus',
    user: 'postgres',
    password: 'postgres' // Common default password
  },
  {
    host: 'localhost',
    port: 5432,
    database: 'creatornexus',
    user: 'postgres',
    password: 'password' // Another common default
  },
  {
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Try connecting to default postgres database first
    user: 'postgres',
    password: 'postgres'
  }
];

async function setupDatabase() {
  let client = null;
  let config = null;
  
  // Try to connect with different configurations
  for (const cfg of configs) {
    try {
      console.log(`🔌 Trying to connect with config: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
      client = new Client(cfg);
      await client.connect();
      config = cfg;
      console.log('✅ Connected successfully!');
      break;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      if (client) {
        await client.end();
        client = null;
      }
    }
  }
  
  if (!client || !config) {
    console.log('❌ Could not connect to any database configuration');
    console.log('\n🔧 Please check:');
    console.log('1. Is PostgreSQL running?');
    console.log('2. What is your postgres password?');
    console.log('3. Is the creatornexus database created?');
    console.log('\n💡 You can also try:');
    console.log('- Run: createdb creatornexus (if you have createdb command)');
    console.log('- Or connect to psql and run: CREATE DATABASE creatornexus;');
    return;
  }
  
  try {
    // Check if creatornexus database exists, if not create it
    if (config.database === 'postgres') {
      console.log('📝 Creating creatornexus database...');
      try {
        await client.query('CREATE DATABASE creatornexus');
        console.log('✅ Database created successfully');
      } catch (error) {
        if (error.code === '42P04') {
          console.log('ℹ️ Database already exists');
        } else {
          console.log('❌ Failed to create database:', error.message);
          return;
        }
      }
      
      // Close connection and reconnect to the new database
      await client.end();
      config.database = 'creatornexus';
      client = new Client(config);
      await client.connect();
      console.log('✅ Connected to creatornexus database');
    }
    
    // Create tables
    console.log('📝 Creating tables...');
    
    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    console.log('✅ Sessions table created');
    
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
    console.log('✅ Users table created');
    
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
    console.log('✅ Projects table created');
    
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
    console.log('✅ Content table created');
    
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
    console.log('✅ Social accounts table created');
    
    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
      );
    `);
    console.log('✅ Notifications table created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('  - sessions');
    console.log('  - users');
    console.log('  - projects');
    console.log('  - content');
    console.log('  - social_accounts');
    console.log('  - notifications');
    console.log('\n🚀 You can now test the step-by-step project creation flow!');
    
  } catch (error) {
    console.error('❌ Error during table creation:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupDatabase();
