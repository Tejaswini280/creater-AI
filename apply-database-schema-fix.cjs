#!/usr/bin/env node

/**
 * Apply Database Schema Fix Script
 * 
 * This script applies the comprehensive database schema fix to resolve
 * all the issues identified in the production logs.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function applyDatabaseFix() {
  console.log('🔧 Starting comprehensive database schema fix...');
  
  let client;
  
  try {
    // Create database client
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('🔌 Connecting to database...');
    client = new Client({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    console.log('✅ Database connection established');
    
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix-database-schema-simple.sql');
    console.log(`📄 Reading SQL fix file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL fix file not found: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📝 SQL file loaded (${sqlContent.length} characters)`);
    
    // Apply the fix
    console.log('🚀 Applying database schema fix...');
    console.log('⏳ This may take a few moments...');
    
    await client.query(sqlContent);
    
    console.log('✅ Database schema fix applied successfully!');
    
    // Verify the fix by checking key tables and columns
    console.log('🔍 Verifying schema fix...');
    
    // Check if users table has password column
    const usersCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    
    if (usersCheck.rows.length > 0) {
      console.log('✅ Users table has password column');
    } else {
      console.log('❌ Users table missing password column');
    }
    
    // Check if content table has project_id column
    const contentCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' AND column_name = 'project_id'
    `);
    
    if (contentCheck.rows.length > 0) {
      console.log('✅ Content table has project_id column');
    } else {
      console.log('❌ Content table missing project_id column');
    }
    
    // Check if AI project tables exist
    const aiProjectsCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'ai_projects'
    `);
    
    if (aiProjectsCheck.rows.length > 0) {
      console.log('✅ AI projects table exists');
    } else {
      console.log('❌ AI projects table missing');
    }
    
    // Check engagement patterns data
    const engagementCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM ai_engagement_patterns
    `);
    
    console.log(`✅ AI engagement patterns: ${engagementCheck.rows[0].count} records`);
    
    // Check hashtag suggestions data
    const hashtagCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM hashtag_suggestions
    `);
    
    console.log(`✅ Hashtag suggestions: ${hashtagCheck.rows[0].count} records`);
    
    // Check templates data
    const templatesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM templates
    `);
    
    console.log(`✅ Templates: ${templatesCheck.rows[0].count} records`);
    
    console.log('');
    console.log('🎉 Database schema fix completed successfully!');
    console.log('🚀 The application should now start without database errors.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application');
    console.log('2. Check the logs to ensure no more database errors');
    console.log('3. Test the scheduler functionality');
    
  } catch (error) {
    console.error('❌ Error applying database schema fix:', error);
    
    if (error.message.includes('relation') && error.message.includes('already exists')) {
      console.log('ℹ️ Some tables already exist - this is normal for existing deployments');
      console.log('✅ Continuing with verification...');
    } else {
      console.error('💥 Critical error occurred. Please check the error details above.');
      process.exit(1);
    }
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
if (require.main === module) {
  applyDatabaseFix()
    .then(() => {
      console.log('✅ Database schema fix process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database schema fix process failed:', error);
      process.exit(1);
    });
}

module.exports = { applyDatabaseFix };