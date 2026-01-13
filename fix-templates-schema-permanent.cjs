#!/usr/bin/env node

/**
 * PERMANENT FIX FOR TEMPLATES TABLE SCHEMA CONFLICT
 * 
 * Root Cause:
 * - Migration 0001 creates templates table with 'title' column
 * - Migration 0018 expects templates table with 'name' column  
 * - Migration 0004 seed data tries to insert using 'name' column
 * - Result: "column 'name' of relation 'templates' does not exist"
 * 
 * Solution:
 * - Add 'name' column to templates table
 * - Migrate existing data from 'title' to 'name'
 * - Add unique constraint on 'name'
 * - Ensure all required columns exist
 */

const { Client } = require('pg');

async function fixTemplatesSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📊 Checking templates table schema...');
    
    // Check if templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'templates'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Templates table does not exist!');
      console.log('   This should have been created by migration 0001');
      process.exit(1);
    }

    console.log('✅ Templates table exists');

    // Check current columns
    const columnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'templates'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Current templates table columns:');
    columnsCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    const hasNameColumn = columnsCheck.rows.some(col => col.column_name === 'name');
    const hasTitleColumn = columnsCheck.rows.some(col => col.column_name === 'title');
    const hasTemplateDataColumn = columnsCheck.rows.some(col => col.column_name === 'template_data');

    console.log('\n🔍 Schema Analysis:');
    console.log(`   - Has 'name' column: ${hasNameColumn ? '✅' : '❌'}`);
    console.log(`   - Has 'title' column: ${hasTitleColumn ? '✅' : '❌'}`);
    console.log(`   - Has 'template_data' column: ${hasTemplateDataColumn ? '✅' : '❌'}`);

    // Begin transaction
    await client.query('BEGIN');

    let changesMade = false;

    // Add 'name' column if missing
    if (!hasNameColumn) {
      console.log('\n🔧 Adding "name" column to templates table...');
      
      // Add column as nullable first
      await client.query(`
        ALTER TABLE templates ADD COLUMN name VARCHAR(255);
      `);
      console.log('✅ Added name column');

      // Migrate data from title if it exists
      if (hasTitleColumn) {
        console.log('🔄 Migrating data from "title" to "name"...');
        const result = await client.query(`
          UPDATE templates SET name = title WHERE name IS NULL AND title IS NOT NULL;
        `);
        console.log(`✅ Migrated ${result.rowCount} rows`);
      }

      // Make it NOT NULL
      await client.query(`
        ALTER TABLE templates ALTER COLUMN name SET NOT NULL;
      `);
      console.log('✅ Set name column to NOT NULL');

      // Add unique constraint
      await client.query(`
        ALTER TABLE templates ADD CONSTRAINT templates_name_key UNIQUE (name);
      `);
      console.log('✅ Added unique constraint on name');

      changesMade = true;
    } else {
      console.log('\n✅ Column "name" already exists');
    }

    // Add 'template_data' column if missing
    if (!hasTemplateDataColumn) {
      console.log('\n🔧 Adding "template_data" column to templates table...');
      await client.query(`
        ALTER TABLE templates ADD COLUMN template_data JSONB;
      `);
      console.log('✅ Added template_data column');
      changesMade = true;
    } else {
      console.log('✅ Column "template_data" already exists');
    }

    // Ensure other required columns exist
    const requiredColumns = [
      { name: 'description', type: 'TEXT' },
      { name: 'category', type: 'VARCHAR(100)' },
      { name: 'is_featured', type: 'BOOLEAN DEFAULT false' }
    ];

    for (const col of requiredColumns) {
      const exists = columnsCheck.rows.some(c => c.column_name === col.name);
      if (!exists) {
        console.log(`\n🔧 Adding "${col.name}" column...`);
        await client.query(`
          ALTER TABLE templates ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`✅ Added ${col.name} column`);
        changesMade = true;
      }
    }

    // Create index on name if it doesn't exist
    const indexCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'templates' AND indexname = 'idx_templates_name'
      );
    `);

    if (!indexCheck.rows[0].exists) {
      console.log('\n🔧 Creating index on name column...');
      await client.query(`
        CREATE INDEX idx_templates_name ON templates(name);
      `);
      console.log('✅ Created index');
      changesMade = true;
    }

    // Commit transaction
    await client.query('COMMIT');

    if (changesMade) {
      console.log('\n✅ Templates table schema fixed successfully!');
      console.log('   Migration 0004 seed data can now execute.');
    } else {
      console.log('\n✅ Templates table schema is already correct!');
      console.log('   No changes needed.');
    }

    // Verify final schema
    console.log('\n📋 Final templates table schema:');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'templates'
      ORDER BY ordinal_position;
    `);
    finalColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error fixing templates schema:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the fix
fixTemplatesSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
