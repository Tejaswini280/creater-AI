#!/usr/bin/env node

/**
 * Verification Script: Scheduler Schema Fix
 * 
 * This script verifies that the scheduler schema fix was applied successfully
 * and that the scheduler service can start without errors.
 */

const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL || '', {
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifySchedulerSchemaFix() {
  console.log('🔍 Verifying Scheduler Schema Fix...\n');

  try {
    // Test 1: Check all required columns exist
    console.log('Test 1: Checking required columns...');
    
    const requiredColumns = [
      'id', 'user_id', 'project_id', 'title', 'description', 'script',
      'platform', 'content_type', 'status', 'scheduled_at', 'published_at',
      'thumbnail_url', 'video_url', 'tags', 'metadata', 'ai_generated',
      'day_number', 'is_paused', 'is_stopped', 'can_publish',
      'publish_order', 'content_version', 'last_regenerated_at',
      'created_at', 'updated_at'
    ];

    const existingColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
    `;

    const columnNames = existingColumns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      console.error('   ❌ FAILED: Missing columns:', missingColumns.join(', '));
      console.error('   Run: node fix-scheduler-schema-permanent.cjs');
      process.exit(1);
    }

    console.log(`   ✅ PASSED: All ${requiredColumns.length} required columns exist\n`);

    // Test 2: Check NOT NULL constraints
    console.log('Test 2: Checking NOT NULL constraints...');
    
    const notNullColumns = ['content_type', 'platform', 'status'];
    const notNullCheck = existingColumns.filter(col => 
      notNullColumns.includes(col.column_name) && col.is_nullable === 'YES'
    );

    if (notNullCheck.length > 0) {
      console.error('   ❌ FAILED: Columns should be NOT NULL:', 
        notNullCheck.map(c => c.column_name).join(', '));
      process.exit(1);
    }

    console.log('   ✅ PASSED: All critical columns have NOT NULL constraints\n');

    // Test 3: Check for NULL values in critical columns
    console.log('Test 3: Checking for NULL values in critical columns...');
    
    const nullChecks = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE content_type IS NULL) as null_content_type,
        COUNT(*) FILTER (WHERE platform IS NULL) as null_platform,
        COUNT(*) FILTER (WHERE status IS NULL) as null_status
      FROM content
    `;

    const nullCheck = nullChecks[0];
    if (nullCheck.null_content_type > 0 || nullCheck.null_platform > 0 || nullCheck.null_status > 0) {
      console.error('   ❌ FAILED: Found NULL values in critical columns');
      console.error('      content_type:', nullCheck.null_content_type);
      console.error('      platform:', nullCheck.null_platform);
      console.error('      status:', nullCheck.null_status);
      process.exit(1);
    }

    console.log('   ✅ PASSED: No NULL values in critical columns\n');

    // Test 4: Check indexes exist
    console.log('Test 4: Checking performance indexes...');
    
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'content'
    `;

    const requiredIndexes = [
      'idx_content_status',
      'idx_content_scheduled_at',
      'idx_content_user_id',
      'idx_content_platform',
      'idx_content_content_type'
    ];

    const indexNames = indexes.map(idx => idx.indexname);
    const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));

    if (missingIndexes.length > 0) {
      console.warn('   ⚠️  WARNING: Missing indexes:', missingIndexes.join(', '));
      console.warn('   These are optional but recommended for performance');
    } else {
      console.log(`   ✅ PASSED: All ${requiredIndexes.length} performance indexes exist\n`);
    }

    // Test 5: Test scheduler query
    console.log('Test 5: Testing scheduler query...');
    
    try {
      const testQuery = await sql`
        SELECT id, user_id, title, description, script,
               platform, content_type, status, scheduled_at,
               created_at, updated_at, metadata
        FROM content
        WHERE status = 'scheduled'
        LIMIT 5
      `;
      
      console.log(`   ✅ PASSED: Scheduler query executed successfully (${testQuery.length} rows)\n`);
    } catch (error) {
      console.error('   ❌ FAILED: Scheduler query failed:', error.message);
      process.exit(1);
    }

    // Test 6: Check content statistics
    console.log('Test 6: Content table statistics...');
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total_content,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_content,
        COUNT(*) FILTER (WHERE status = 'published') as published_content,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_content,
        COUNT(DISTINCT platform) as platforms_used,
        COUNT(DISTINCT content_type) as content_types_used
      FROM content
    `;

    const stat = stats[0];
    console.log('   Content Statistics:');
    console.log(`     Total content: ${stat.total_content}`);
    console.log(`     Scheduled: ${stat.scheduled_content}`);
    console.log(`     Published: ${stat.published_content}`);
    console.log(`     Draft: ${stat.draft_content}`);
    console.log(`     Platforms: ${stat.platforms_used}`);
    console.log(`     Content types: ${stat.content_types_used}`);
    console.log('   ✅ PASSED: Statistics retrieved successfully\n');

    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Schema Status: READY');
    console.log('Scheduler Status: CAN START');
    console.log('');
    console.log('The scheduler service should now start without errors.');
    console.log('You can safely restart your application.');
    console.log('');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run verification
verifySchedulerSchemaFix().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
