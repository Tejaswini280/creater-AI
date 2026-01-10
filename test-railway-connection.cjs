#!/usr/bin/env node

/**
 * Test Railway Database Connection
 * 
 * This script tests the connection to the Railway database
 * and shows the current environment setup.
 */

const { Pool } = require('pg');

// Railway database URL from the logs (you'll need to replace with actual credentials)
const RAILWAY_DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:password@postgres.railway.internal:5432/railway";

console.log('🔍 Testing Railway database connection...');
console.log('📋 Environment variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'Not set');

async function testConnection() {
  const pool = new Pool({
    connectionString: RAILWAY_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Attempting to connect to Railway database...');
    const client = await pool.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database info:');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].postgres_version.substring(0, 50) + '...');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log('   -', row.table_name);
    });
    
    client.release();
    console.log('🎉 Railway database connection test successful!');
    
  } catch (error) {
    console.error('❌ Railway database connection failed:', error.message);
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check if DATABASE_URL is correctly set');
    console.error('   2. Verify Railway database is running');
    console.error('   3. Check network connectivity to Railway');
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);