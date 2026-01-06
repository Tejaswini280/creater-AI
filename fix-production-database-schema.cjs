#!/usr/bin/env node

/**
 * Fix Production Database Schema - Add Missing project_id Column
 * This script safely adds the missing project_id column to the content table
 * without affecting the local development environment.
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function fixProductionSchema() {
  try {
    console.log('🔧 Starting production database schema fix...');
    
    // Check if project_id column exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name = 'project_id'
    `;

    if (columnExists.length === 0) {
      console.log('📝 Adding missing project_id column to content table...');
      
      // Add project_id column as nullable initially
      await sql`
        ALTER TABLE content 
        ADD COLUMN IF NOT EXISTS project_id INTEGER
      `;
      
      console.log('✅ project_id column added successfully');
      
      // Create index for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_content_project_id 
        ON content(project_id) 
        WHERE project_id IS NOT NULL
      `;
      
      console.log('✅ Index created for project_id column');
      
    } else {
      console.log('✅ project_id column already exists');
    }

    // Verify the fix
    const verification = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name = 'project_id'
    `;

    if (verification.length > 0) {
      console.log('✅ Schema fix verified successfully');
      console.log(`   Column: ${verification[0].column_name}`);
      console.log(`   Type: ${verification[0].data_type}`);
      console.log(`   Nullable: ${verification[0].is_nullable}`);
    }

    console.log('🎉 Production database schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database schema:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fix
fixProductionSchema()
  .then(() => {
    console.log('✅ Database schema fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database schema fix failed:', error);
    process.exit(1);
  });