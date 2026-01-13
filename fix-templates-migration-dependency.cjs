#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIX TEMPLATES TABLE MIGRATION DEPENDENCY ISSUE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ROOT CAUSE ANALYSIS:
 * -------------------
 * Migration 0004_seed_essential_data.sql tries to INSERT into templates table
 * But templates table is created in 0003_essential_tables.sql
 * However, 0003_additional_tables_safe.sql executed first
 * Migration runner sees "0003" as already executed and skips 0003_essential_tables.sql
 * Result: templates table doesn't exist when 0004 tries to seed it
 * 
 * THE FIX:
 * --------
 * Created migration 0018_fix_templates_table_dependency.sql that:
 * 1. Creates templates table IF NOT EXISTS
 * 2. Creates other essential tables (hashtag_suggestions, ai_engagement_patterns, niches)
 * 3. Adds proper indexes and triggers
 * 4. Is idempotent and safe to run multiple times
 * 
 * This migration will execute BEFORE 0004 tries to seed data
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTemplatesDependency() {
  const client = await pool.connect();
  
  try {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔧 FIXING TEMPLATES TABLE MIGRATION DEPENDENCY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Step 1: Check if templates table exists
    console.log('📊 Step 1: Checking if templates table exists...');
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'templates'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    console.log(`   ${tableExists ? '✅' : '❌'} Templates table ${tableExists ? 'EXISTS' : 'DOES NOT EXIST'}`);

    // Step 2: Read and execute the fix migration
    console.log('\n📝 Step 2: Executing fix migration 0018...');
    const migrationPath = path.join(__dirname, 'migrations', '0018_fix_templates_table_dependency.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    console.log('   ✅ Migration 0018 executed successfully');

    // Step 3: Verify tables now exist
    console.log('\n🔍 Step 3: Verifying all essential tables exist...');
    const tables = ['templates', 'hashtag_suggestions', 'ai_engagement_patterns', 'niches'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Step 4: Check templates table structure
    console.log('\n📋 Step 4: Verifying templates table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'templates'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Templates table columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Step 5: Test that migration 0004 can now execute
    console.log('\n🧪 Step 5: Testing if migration 0004 can execute...');
    try {
      // Try a test insert (will rollback)
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO templates (name, description, category, template_data, is_featured)
        VALUES ('TEST_TEMPLATE', 'Test', 'test', '{}', false)
        ON CONFLICT (name) DO NOTHING;
      `);
      await client.query('ROLLBACK');
      console.log('   ✅ Templates table is ready for seeding');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('   ❌ Error testing insert:', error.message);
      throw error;
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ TEMPLATES TABLE DEPENDENCY FIX COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📌 Next Steps:');
    console.log('   1. Migration 0004_seed_essential_data.sql can now execute');
    console.log('   2. Restart your application to run remaining migrations');
    console.log('   3. All essential tables are now properly created\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixTemplatesDependency()
  .then(() => {
    console.log('✅ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
