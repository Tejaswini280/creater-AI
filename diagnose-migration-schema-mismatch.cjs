/**
 * COMPREHENSIVE MIGRATION & SCHEMA DIAGNOSTIC TOOL
 * 
 * This script performs a deep analysis to identify:
 * 1. Why 28 out of 29 migrations were skipped
 * 2. Why schema validation passes despite missing columns
 * 3. What the actual database schema looks like vs expected
 * 4. Which migrations were marked as executed but didn't fully run
 * 5. Root cause of the "script" column missing error
 */

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1
});

// Expected schema from strictMigrationRunner.ts
const EXPECTED_SCHEMA = {
  users: ['id', 'email', 'password_hash', 'full_name', 'is_active', 'created_at', 'updated_at'],
  projects: ['id', 'user_id', 'name', 'description', 'status', 'created_at', 'updated_at'],
  content: [
    'id', 'user_id', 'project_id', 'title', 'description', 'script', 
    'platform', 'content_type', 'status', 'scheduled_at', 'published_at',
    'thumbnail_url', 'video_url', 'tags', 'metadata', 'ai_generated',
    'day_number', 'is_paused', 'is_stopped', 'can_publish', 'publish_order',
    'content_version', 'last_regenerated_at', 'created_at', 'updated_at'
  ],
  content_metrics: ['id', 'content_id', 'views', 'likes', 'shares', 'comments', 'engagement_rate', 'created_at'],
  social_posts: ['id', 'user_id', 'project_id', 'title', 'caption', 'hashtags', 'emojis', 'content_type', 'status', 'scheduled_at', 'published_at', 'thumbnail_url', 'media_urls', 'ai_generated', 'metadata', 'created_at', 'updated_at'],
  post_schedules: ['id', 'social_post_id', 'platform', 'scheduled_at', 'status', 'retry_count', 'last_attempt_at', 'error_message', 'metadata', 'recurrence', 'timezone', 'series_end_date', 'project_id', 'title', 'description', 'content_type', 'duration', 'tone', 'target_audience', 'time_distribution', 'created_at', 'updated_at'],
  ai_content_suggestions: ['id', 'user_id', 'project_id', 'suggestion_type', 'platform', 'content', 'confidence', 'metadata', 'created_at'],
  schema_migrations: ['id', 'filename', 'executed_at', 'checksum', 'execution_time_ms', 'status', 'error_message']
};

async function diagnose() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 COMPREHENSIVE MIGRATION & SCHEMA DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Check migration tracking table
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 STEP 1: Analyzing migration tracking table...\n');
    
    const migrations = await sql`
      SELECT filename, status, executed_at, execution_time_ms, error_message
      FROM schema_migrations
      ORDER BY filename
    `;
    
    console.log(`Total migrations in tracking table: ${migrations.length}`);
    console.log(`\nMigration Status Breakdown:`);
    
    const statusCounts = migrations.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log(`\nMigrations marked as 'completed':`);
    migrations
      .filter(m => m.status === 'completed')
      .forEach(m => {
        console.log(`  ✅ ${m.filename} (${m.execution_time_ms}ms)`);
      });
    
    const failedMigrations = migrations.filter(m => m.status === 'failed');
    if (failedMigrations.length > 0) {
      console.log(`\n⚠️  Migrations marked as 'failed':`);
      failedMigrations.forEach(m => {
        console.log(`  ❌ ${m.filename}`);
        console.log(`     Error: ${m.error_message}`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Check actual database schema
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n📊 STEP 2: Analyzing actual database schema...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`Total tables in database: ${tables.length}`);
    console.log(`Tables: ${tables.map(t => t.table_name).join(', ')}\n`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Compare expected vs actual schema
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 STEP 3: Comparing expected vs actual schema...\n');
    
    const schemaMismatches = [];
    
    for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
      // Check if table exists
      const tableExists = tables.some(t => t.table_name === tableName);
      
      if (!tableExists) {
        console.log(`❌ Table '${tableName}' is MISSING`);
        schemaMismatches.push({ table: tableName, issue: 'table_missing' });
        continue;
      }
      
      // Get actual columns
      const actualColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      const actualColumnNames = actualColumns.map(c => c.column_name);
      
      // Find missing columns
      const missingColumns = expectedColumns.filter(col => !actualColumnNames.includes(col));
      
      // Find extra columns (not in expected schema)
      const extraColumns = actualColumnNames.filter(col => !expectedColumns.includes(col));
      
      if (missingColumns.length > 0 || extraColumns.length > 0) {
        console.log(`\n⚠️  Table '${tableName}' has schema mismatches:`);
        
        if (missingColumns.length > 0) {
          console.log(`  Missing columns (expected but not found):`);
          missingColumns.forEach(col => {
            console.log(`    ❌ ${col}`);
            schemaMismatches.push({ table: tableName, column: col, issue: 'column_missing' });
          });
        }
        
        if (extraColumns.length > 0) {
          console.log(`  Extra columns (found but not expected):`);
          extraColumns.forEach(col => {
            console.log(`    ➕ ${col}`);
          });
        }
        
        console.log(`  Actual columns (${actualColumns.length}):`);
        actualColumns.forEach(col => {
          const status = expectedColumns.includes(col.column_name) ? '✅' : '➕';
          console.log(`    ${status} ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      } else {
        console.log(`✅ Table '${tableName}' schema matches expected (${actualColumns.length} columns)`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Identify root cause
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n🎯 STEP 4: ROOT CAUSE ANALYSIS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (schemaMismatches.length === 0) {
      console.log('✅ NO SCHEMA MISMATCHES FOUND');
      console.log('   All expected tables and columns are present.');
      console.log('   The schema validation should pass.');
    } else {
      console.log(`❌ FOUND ${schemaMismatches.length} SCHEMA MISMATCHES\n`);
      
      console.log('ROOT CAUSE ANALYSIS:');
      console.log('-------------------');
      
      // Group mismatches by issue type
      const missingTables = schemaMismatches.filter(m => m.issue === 'table_missing');
      const missingColumns = schemaMismatches.filter(m => m.issue === 'column_missing');
      
      if (missingTables.length > 0) {
        console.log(`\n1. MISSING TABLES (${missingTables.length}):`);
        console.log('   These tables are expected but do not exist in the database.');
        console.log('   This indicates that migrations creating these tables never ran.');
        missingTables.forEach(m => {
          console.log(`   - ${m.table}`);
        });
      }
      
      if (missingColumns.length > 0) {
        console.log(`\n2. MISSING COLUMNS (${missingColumns.length}):`);
        console.log('   These columns are expected but do not exist in their tables.');
        console.log('   This indicates that:');
        console.log('   a) Migrations adding these columns never ran, OR');
        console.log('   b) Migrations were marked as "completed" but failed silently, OR');
        console.log('   c) EXPECTED_SCHEMA is out of sync with actual migrations');
        
        // Group by table
        const columnsByTable = missingColumns.reduce((acc, m) => {
          if (!acc[m.table]) acc[m.table] = [];
          acc[m.table].push(m.column);
          return acc;
        }, {});
        
        Object.entries(columnsByTable).forEach(([table, columns]) => {
          console.log(`\n   Table: ${table}`);
          columns.forEach(col => console.log(`     - ${col}`));
        });
      }
      
      console.log('\n\nRECOMMENDED ACTIONS:');
      console.log('-------------------');
      console.log('1. Review EXPECTED_SCHEMA in strictMigrationRunner.ts');
      console.log('   - Ensure it matches what migrations ACTUALLY create');
      console.log('   - Remove columns that are added in later migrations');
      console.log('   - EXPECTED_SCHEMA should match state AFTER migration 0001, not after ALL migrations');
      console.log('');
      console.log('2. Create corrective migrations for missing columns');
      console.log('   - Add idempotent ALTER TABLE statements');
      console.log('   - Use "IF NOT EXISTS" clauses');
      console.log('');
      console.log('3. Fix migration tracking');
      console.log('   - Ensure migrations are only marked "completed" after full execution');
      console.log('   - Add post-execution validation');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Check specific "script" column issue
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n🔍 STEP 5: Specific check for "script" column issue\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const contentTable = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'content'
      ORDER BY ordinal_position
    `;
    
    const hasScriptColumn = contentTable.some(c => c.column_name === 'script');
    
    if (hasScriptColumn) {
      console.log('✅ "script" column EXISTS in content table');
      console.log('   The scheduler error should not occur.');
    } else {
      console.log('❌ "script" column is MISSING from content table');
      console.log('   This is causing the scheduler initialization error.');
      console.log('');
      console.log('   Migration 0027 should add this column.');
      console.log('   Check if migration 0027 has been executed:');
      
      const migration0027 = migrations.find(m => m.filename.includes('0027'));
      if (migration0027) {
        console.log(`   Status: ${migration0027.status}`);
        if (migration0027.error_message) {
          console.log(`   Error: ${migration0027.error_message}`);
        }
      } else {
        console.log('   ❌ Migration 0027 is NOT in the tracking table');
        console.log('   This migration needs to be executed.');
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    console.error(error.stack);
  } finally {
    await sql.end();
  }
}

diagnose().catch(console.error);
