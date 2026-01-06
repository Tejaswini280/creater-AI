#!/usr/bin/env node

/**
 * Railway Database Migration
 * This script can be run as a one-time job in Railway to fix the database schema
 */

const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Railway database');

    // Check if project_id column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name = 'project_id'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('📝 Adding missing project_id column...');
      
      // Add project_id column
      await client.query(`
        ALTER TABLE content 
        ADD COLUMN IF NOT EXISTS project_id INTEGER
      `);
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_content_project_id 
        ON content(project_id) 
        WHERE project_id IS NOT NULL
      `);
      
      console.log('✅ Database schema updated successfully');
    } else {
      console.log('✅ project_id column already exists');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();