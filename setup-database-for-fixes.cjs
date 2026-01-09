#!/usr/bin/env node

/**
 * DATABASE SETUP FOR CRITICAL FIXES
 * 
 * This script ensures the database exists before applying critical fixes
 */

const { Client } = require('pg');

// Database configuration
const getDatabaseConfig = (includeDatabase = true) => {
  // Try Railway production first
  if (process.env.DATABASE_URL) {
    console.log('🚀 Using Railway DATABASE_URL');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  // Fallback to individual environment variables
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  if (includeDatabase) {
    config.database = process.env.DB_NAME || 'creators_dev_db';
  }

  return config;
};

async function setupDatabase() {
  console.log('🔧 Setting up database for critical fixes...');
  
  const dbName = process.env.DB_NAME || 'creators_dev_db';
  console.log('📊 Target database:', dbName);

  // First, connect without specifying database to check if it exists
  const adminClient = new Client(getDatabaseConfig(false));
  
  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1;
    `;
    
    const result = await adminClient.query(checkDbQuery, [dbName]);
    
    if (result.rows.length === 0) {
      console.log(`📊 Database "${dbName}" does not exist, creating it...`);
      
      // Create database
      await adminClient.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🔧 PostgreSQL Connection Failed:');
      console.error('   1. Make sure PostgreSQL is installed and running');
      console.error('   2. Check connection settings in .env file');
      console.error('   3. Verify PostgreSQL service is started');
      console.error('');
      console.error('💡 To install PostgreSQL:');
      console.error('   • Windows: Download from https://www.postgresql.org/download/windows/');
      console.error('   • macOS: brew install postgresql');
      console.error('   • Linux: sudo apt-get install postgresql');
    }
    
    throw error;
  } finally {
    await adminClient.end();
  }

  // Now test connection to the target database
  const testClient = new Client(getDatabaseConfig(true));
  
  try {
    console.log(`🔌 Testing connection to database "${dbName}"...`);
    await testClient.connect();
    console.log('✅ Database connection test successful');
    
    // Check if we need to run initial schema setup
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    const tablesResult = await testClient.query(tablesQuery);
    console.log(`📊 Found ${tablesResult.rows.length} existing tables`);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Database is empty - you may need to run initial migrations first');
      console.log('💡 Consider running: npm run migrate or your initial setup script');
    } else {
      console.log('✅ Database has existing schema, ready for critical fixes');
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw error;
  } finally {
    await testClient.end();
  }

  console.log('🎉 Database setup completed successfully!');
  console.log('🚀 Ready to apply critical database fixes');
}

// Handle script execution
if (require.main === module) {
  console.log('🔧 DATABASE SETUP FOR CRITICAL FIXES');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('');
  
  setupDatabase().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };