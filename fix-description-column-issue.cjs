#!/usr/bin/env node

/**
 * Fix Description Column Issue
 * 
 * Root Cause Analysis:
 * - The scheduler service expects a 'description' column in the 'content' table
 * - The column is defined in the schema but missing from the actual database
 * - This causes PostgresError: column "description" does not exist
 * 
 * Solution:
 * - Add the missing description column to the content table
 * - Verify the fix by checking the column exists
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const getDatabaseUrl = () => {
  // Try different environment variable names
  return process.env.DATABASE_URL || 
         process.env.DATABASE_PRIVATE_URL || 
         process.env.POSTGRES_URL ||
         'postgresql://postgres:postgres@localhost:5432/creator_ai';
};

async function checkDescriptionColumn() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if description column exists
    console.log('\n📋 Checking if description column exists in content table...');
    
    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'content' AND column_name = 'description';
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Description column exists:');
      console.log(result.rows[0]);
      return true;
    } else {
      console.log('❌ Description column does NOT exist');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking description column:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function addDescriptionColumn() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n🔧 Adding description column to content table...');
    
    // Add the column
    await client.query(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    console.log('✅ Description column added successfully');

    // Add comment
    await client.query(`
      COMMENT ON COLUMN content.description IS 'Content description for scheduled posts and content items';
    `);
    
    console.log('✅ Column comment added');

    // Update existing NULL values
    const updateResult = await client.query(`
      UPDATE content 
      SET description = '' 
      WHERE description IS NULL;
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} rows with empty description`);

    // Verify the fix
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'content' AND column_name = 'description';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('\n✅ VERIFICATION SUCCESSFUL:');
      console.log(verifyResult.rows[0]);
      return true;
    } else {
      console.log('\n❌ VERIFICATION FAILED: Column still missing');
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding description column:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function runMigration() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n🚀 Running migration 0026_add_missing_description_column.sql...');
    
    const migrationPath = path.join(__dirname, 'migrations', '0026_add_missing_description_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FIX DESCRIPTION COLUMN ISSUE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if column exists
    const columnExists = await checkDescriptionColumn();
    
    if (columnExists) {
      console.log('\n✅ Description column already exists. No fix needed.');
      process.exit(0);
    }

    // Step 2: Add the column
    console.log('\n🔧 Applying fix...');
    await addDescriptionColumn();

    // Step 3: Run the migration for documentation
    console.log('\n📝 Running migration for documentation...');
    await runMigration();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ FIX COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nThe scheduler service should now work without errors.');
    console.log('Please restart your application to apply the changes.\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('  ❌ FIX FAILED');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('\nError:', error.message);
    console.error('\nPlease check your database connection and try again.\n');
    process.exit(1);
  }
}

// Run the fix
main();
