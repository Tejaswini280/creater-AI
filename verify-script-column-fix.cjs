#!/usr/bin/env node

/**
 * Verification Script: Script Column Fix
 * 
 * This script verifies that the script column exists in the content table
 * and that the scheduler service can query it without errors.
 */

const postgres = require('postgres');

async function verifyScriptColumnFix() {
  console.log('🔍 Verifying Script Column Fix...\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Check if content table exists
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 Step 1: Checking if content table exists...');
    
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content'
      ) as table_exists
    `;
    
    if (!tableCheck[0].table_exists) {
      console.error('❌ Content table does not exist!');
      process.exit(1);
    }
    
    console.log('✅ Content table exists\n');

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Check if script column exists
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 Step 2: Checking if script column exists...');
    
    const columnCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
      AND column_name = 'script'
    `;
    
    if (columnCheck.length === 0) {
      console.error('❌ Script column does not exist in content table!');
      console.log('\n💡 Run the migration to fix this:');
      console.log('   npm run migrate\n');
      process.exit(1);
    }
    
    console.log('✅ Script column exists');
    console.log(`   - Data Type: ${columnCheck[0].data_type}`);
    console.log(`   - Nullable: ${columnCheck[0].is_nullable}\n`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Test querying the script column
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 Step 3: Testing script column query...');
    
    try {
      const testQuery = await sql`
        SELECT id, title, script, status, scheduled_at
        FROM content
        WHERE status = 'scheduled'
        LIMIT 5
      `;
      
      console.log(`✅ Successfully queried script column (${testQuery.length} scheduled items found)\n`);
      
      if (testQuery.length > 0) {
        console.log('📊 Sample scheduled content:');
        testQuery.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id}, Title: ${item.title}`);
          console.log(`      Script: ${item.script ? item.script.substring(0, 50) + '...' : 'NULL'}`);
          console.log(`      Scheduled: ${item.scheduled_at || 'Not scheduled'}\n`);
        });
      }
    } catch (queryError) {
      console.error('❌ Error querying script column:', queryError.message);
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Check all required columns for scheduler
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 Step 4: Verifying all required scheduler columns...');
    
    const requiredColumns = [
      'id', 'user_id', 'title', 'description', 'script', 
      'platform', 'status', 'scheduled_at', 'created_at', 'updated_at'
    ];
    
    const allColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
      AND column_name = ANY(${requiredColumns})
    `;
    
    const existingColumns = allColumns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.error('❌ Missing required columns:', missingColumns.join(', '));
      process.exit(1);
    }
    
    console.log('✅ All required scheduler columns exist\n');

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Test the exact query used by scheduler service
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 Step 5: Testing scheduler service query...');
    
    try {
      // This is the exact query pattern used in scheduler.ts
      const schedulerQuery = await sql`
        SELECT 
          id, user_id, title, description, script, platform, 
          status, scheduled_at, created_at, updated_at, metadata
        FROM content
        WHERE status = 'scheduled'
        ORDER BY scheduled_at ASC
        LIMIT 10
      `;
      
      console.log(`✅ Scheduler query successful (${schedulerQuery.length} items)\n`);
    } catch (schedulerError) {
      console.error('❌ Scheduler query failed:', schedulerError.message);
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE - All Checks Passed!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✓ Content table exists');
    console.log('✓ Script column exists and is queryable');
    console.log('✓ All required scheduler columns present');
    console.log('✓ Scheduler service queries work correctly');
    console.log('');
    console.log('🎉 The scheduler service should now work without errors!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run verification
verifyScriptColumnFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
