#!/usr/bin/env node

const { execSync } = require('child_process');
const { Client } = require('pg');

console.log('🚀 COMPLETE DOCKER FIX STARTING...');

// Stop everything
console.log('🛑 Stopping containers...');
try {
  execSync('docker-compose down -v', { stdio: 'inherit' });
} catch (e) {
  console.log('Containers already stopped');
}

// Start fresh
console.log('🔄 Starting fresh containers...');
execSync('docker-compose up -d', { stdio: 'inherit' });

// Wait for database
console.log('⏳ Waiting for database...');
setTimeout(async () => {
  try {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'creators_dev_db',
      user: 'postgres',
      password: 'postgres123'
    });

    await client.connect();
    console.log('✅ Database connected');

    // Drop and recreate schema
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('🗑️ Schema reset');

    // Create complete schema
    const schema = `
      -- Users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url VARCHAR(500),
        bio TEXT,
        website VARCHAR(255),
        location VARCHAR(255),
        is_verified BOOLEAN DEFAULT false,
        subscription_tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Projects table
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Scheduled content table
      CREATE TABLE scheduled_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        platform VARCHAR(100),
        scheduled_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Analytics table
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        metric_value NUMERIC,
        metadata JSONB DEFAULT '{}',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Templates table
      CREATE TABLE templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        content TEXT,
        settings JSONB DEFAULT '{}',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI content table
      CREATE TABLE ai_generated_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        content_type VARCHAR(100),
        prompt TEXT,
        generated_content TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_projects_user_id ON projects(user_id);
      CREATE INDEX idx_scheduled_content_user_id ON scheduled_content(user_id);
      CREATE INDEX idx_scheduled_content_status ON scheduled_content(status);
      CREATE INDEX idx_analytics_user_id ON analytics(user_id);
      CREATE INDEX idx_templates_user_id ON templates(user_id);
      CREATE INDEX idx_ai_content_user_id ON ai_generated_content(user_id);

      -- Insert test data
      INSERT INTO users (email, password_hash, name) VALUES 
      ('test@example.com', '$2b$10$dummy.hash.for.testing.purposes.only', 'Test User'),
      ('admin@example.com', '$2b$10$dummy.hash.for.testing.purposes.only', 'Admin User');

      INSERT INTO projects (user_id, name, description) VALUES 
      (1, 'Test Project', 'A test project for development'),
      (1, 'Social Media Campaign', 'Marketing campaign project');
    `;

    await client.query(schema);
    console.log('📊 Complete schema created');

    await client.end();

    // Restart app container
    console.log('🔄 Restarting app container...');
    execSync('docker restart creator-ai-app', { stdio: 'inherit' });

    // Wait and test
    setTimeout(async () => {
      console.log('🧪 Testing application...');
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          console.log('✅ APPLICATION IS HEALTHY!');
          
          // Test auth endpoints
          const authStatus = await fetch('http://localhost:5000/api/auth/status');
          console.log(`✅ Auth Status: ${authStatus.status}`);
          
          console.log('🎉 DOCKER FIX COMPLETE - APPLICATION READY!');
        } else {
          console.log('❌ Application still unhealthy');
        }
      } catch (error) {
        console.log('❌ Application test failed:', error.message);
      }
    }, 15000);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}, 20000);