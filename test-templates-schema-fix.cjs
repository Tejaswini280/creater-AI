#!/usr/bin/env node

/**
 * TEST TEMPLATES SCHEMA FIX
 * 
 * This script tests the templates schema fix without modifying the database.
 * It checks if the fix is needed and what changes would be made.
 */

const { Client } = require('pg');

async function testTemplatesSchemaFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'templates'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Templates table does not exist!');
      console.log('   Migration 0001 has not run yet.');
      return;
    }

    console.log('✅ Templates table exists\n');

    // Get current schema
    const columnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'templates'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Current Templates Table Schema:');
    console.log('═══════════════════════════════════════════════════════════════');
    columnsCheck.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for required columns
    const hasNameColumn = columnsCheck.rows.some(col => col.column_name === 'name');
    const hasTitleColumn = columnsCheck.rows.some(col => col.column_name === 'title');
    const hasTemplateDataColumn = columnsCheck.rows.some(col => col.column_name === 'template_data');
    const hasDescriptionColumn = columnsCheck.rows.some(col => col.column_name === 'description');
    const hasCategoryColumn = columnsCheck.rows.some(col => col.column_name === 'category');
    const hasIsFeaturedColumn = columnsCheck.rows.some(col => col.column_name === 'is_featured');

    console.log('🔍 Schema Analysis:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Column 'name':          ${hasNameColumn ? '✅ EXISTS' : '❌ MISSING (REQUIRED FOR MIGRATION 0004)'}`);
    console.log(`   Column 'title':         ${hasTitleColumn ? '✅ EXISTS' : '⚠️  MISSING'}`);
    console.log(`   Column 'template_data': ${hasTemplateDataColumn ? '✅ EXISTS' : '❌ MISSING (REQUIRED FOR MIGRATION 0004)'}`);
    console.log(`   Column 'description':   ${hasDescriptionColumn ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   Column 'category':      ${hasCategoryColumn ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   Column 'is_featured':   ${hasIsFeaturedColumn ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check constraints
    const constraintsCheck = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'templates';
    `);

    console.log('🔒 Constraints:');
    console.log('═══════════════════════════════════════════════════════════════');
    if (constraintsCheck.rows.length === 0) {
      console.log('   No constraints found');
    } else {
      constraintsCheck.rows.forEach(constraint => {
        console.log(`   ${constraint.constraint_name.padEnd(40)} ${constraint.constraint_type}`);
      });
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check indexes
    const indexesCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'templates';
    `);

    console.log('📇 Indexes:');
    console.log('═══════════════════════════════════════════════════════════════');
    if (indexesCheck.rows.length === 0) {
      console.log('   No indexes found');
    } else {
      indexesCheck.rows.forEach(index => {
        console.log(`   ${index.indexname}`);
      });
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Determine if fix is needed
    const fixNeeded = !hasNameColumn || !hasTemplateDataColumn;

    if (fixNeeded) {
      console.log('⚠️  FIX REQUIRED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('   The templates table is missing required columns.');
      console.log('   Migration 0004 will fail with current schema.\n');
      
      console.log('📋 Changes that will be made by Migration 0019:');
      console.log('═══════════════════════════════════════════════════════════════');
      
      if (!hasNameColumn) {
        console.log('   1. ➕ ADD COLUMN name VARCHAR(255)');
        if (hasTitleColumn) {
          console.log('      📝 Migrate data: name = title');
        }
        console.log('      🔒 ALTER COLUMN name SET NOT NULL');
        console.log('      🔑 ADD CONSTRAINT templates_name_key UNIQUE (name)');
      }
      
      if (!hasTemplateDataColumn) {
        console.log('   2. ➕ ADD COLUMN template_data JSONB');
      }
      
      if (!hasDescriptionColumn) {
        console.log('   3. ➕ ADD COLUMN description TEXT');
      }
      
      if (!hasCategoryColumn) {
        console.log('   4. ➕ ADD COLUMN category VARCHAR(100)');
      }
      
      if (!hasIsFeaturedColumn) {
        console.log('   5. ➕ ADD COLUMN is_featured BOOLEAN DEFAULT false');
      }
      
      console.log('   6. 📇 CREATE INDEX idx_templates_name ON templates(name)');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log('🚀 Next Steps:');
      console.log('   1. Run: .\\deploy-templates-schema-fix.ps1');
      console.log('   2. Deploy to Railway');
      console.log('   3. Verify migrations complete successfully\n');
    } else {
      console.log('✅ NO FIX NEEDED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('   The templates table has all required columns.');
      console.log('   Migration 0004 should execute successfully.\n');
    }

    // Check if there's any data in the table
    const dataCheck = await client.query(`
      SELECT COUNT(*) as count FROM templates;
    `);

    console.log('📊 Data Status:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Rows in templates table: ${dataCheck.rows[0].count}`);
    
    if (dataCheck.rows[0].count > 0) {
      console.log('   ⚠️  Table contains data - migration will preserve existing rows');
    } else {
      console.log('   ✅ Table is empty - safe to modify schema');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error testing templates schema:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the test
testTemplatesSchemaFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
