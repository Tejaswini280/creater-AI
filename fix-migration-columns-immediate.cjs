#!/usr/bin/env node

/**
 * IMMEDIATE MIGRATION COLUMN FIX
 * Applies critical column fixes to resolve migration errors
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creator_ai_studio',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function applyColumnFixes() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Starting immediate column fixes...');
    
    // Read the critical fixes migration
    const migrationPath = path.join(__dirname, 'migrations', '0013_critical_column_fixes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Applying critical column fixes migration...');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Critical column fixes applied successfully!');
    
    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    
    // Check if password column exists
    const passwordCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);
    
    if (passwordCheck.rows.length > 0) {
      console.log('✅ Password column exists in users table');
    } else {
      console.log('❌ Password column still missing');
    }
    
    // Check if project_id column exists in content table
    const projectIdCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' AND column_name = 'project_id'
    `);
    
    if (projectIdCheck.rows.length > 0) {
      console.log('✅ project_id column exists in content table');
    } else {
      console.log('❌ project_id column still missing');
    }
    
    // Check if category column exists in projects table
    const categoryCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'category'
    `);
    
    if (categoryCheck.rows.length > 0) {
      console.log('✅ category column exists in projects table');
    } else {
      console.log('❌ category column still missing');
    }
    
    // Update migration tracking
    await pool.query(`
      INSERT INTO schema_migrations (version, applied_at) 
      VALUES ('0013_critical_column_fixes', NOW()) 
      ON CONFLICT (version) DO NOTHING
    `);
    
    console.log('✅ Migration tracking updated');
    console.log('🎯 All critical column fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error applying column fixes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fixes
if (require.main === module) {
  applyColumnFixes()
    .then(() => {
      console.log('✅ Column fixes completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Column fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { applyColumnFixes };