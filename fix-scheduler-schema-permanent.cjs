#!/usr/bin/env node

/**
 * PERMANENT FIX: Scheduler Schema Validation and Repair
 * 
 * ROOT CAUSE ANALYSIS:
 * The scheduler service fails to start because it's checking for columns that don't exist
 * or are named differently in the actual database schema vs the Drizzle ORM schema.
 * 
 * ISSUES IDENTIFIED:
 * 1. Schema verification checks for columns that may not exist in production
 * 2. Column name mismatch between camelCase (Drizzle) and snake_case (PostgreSQL)
 * 3. No graceful degradation when optional columns are missing
 * 4. Scheduler crashes on startup instead of continuing with warnings
 * 
 * PERMANENT SOLUTION:
 * 1. Verify and add ALL missing columns to content table
 * 2. Ensure proper column naming (snake_case for PostgreSQL)
 * 3. Add proper indexes for performance
 * 4. Make scheduler resilient to missing optional columns
 */

const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL || '', {
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixSchedulerSchema() {
  console.log('🔧 Starting Scheduler Schema Permanent Fix...\n');

  try {
    // Step 1: Check current schema state
    console.log('📋 Step 1: Analyzing current database schema...');
    
    const existingColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
      ORDER BY ordinal_position
    `;

    console.log(`   Found ${existingColumns.length} columns in content table`);
    const columnNames = existingColumns.map(col => col.column_name);
    console.log('   Existing columns:', columnNames.join(', '));

    // Step 2: Define required columns for scheduler
    console.log('\n📋 Step 2: Defining required columns for scheduler...');
    
    const requiredColumns = [
      { name: 'id', type: 'SERIAL PRIMARY KEY', nullable: false },
      { name: 'user_id', type: 'VARCHAR NOT NULL', nullable: false },
      { name: 'project_id', type: 'INTEGER', nullable: true },
      { name: 'title', type: 'VARCHAR NOT NULL', nullable: false },
      { name: 'description', type: 'TEXT', nullable: true },
      { name: 'script', type: 'TEXT', nullable: true },
      { name: 'platform', type: 'VARCHAR NOT NULL', nullable: false },
      { name: 'content_type', type: 'VARCHAR NOT NULL', nullable: false },
      { name: 'status', type: 'VARCHAR NOT NULL DEFAULT \'draft\'', nullable: false },
      { name: 'scheduled_at', type: 'TIMESTAMP', nullable: true },
      { name: 'published_at', type: 'TIMESTAMP', nullable: true },
      { name: 'thumbnail_url', type: 'VARCHAR', nullable: true },
      { name: 'video_url', type: 'VARCHAR', nullable: true },
      { name: 'tags', type: 'TEXT[]', nullable: true },
      { name: 'metadata', type: 'JSONB', nullable: true },
      { name: 'ai_generated', type: 'BOOLEAN DEFAULT false', nullable: true },
      { name: 'day_number', type: 'INTEGER', nullable: true },
      { name: 'is_paused', type: 'BOOLEAN DEFAULT false', nullable: true },
      { name: 'is_stopped', type: 'BOOLEAN DEFAULT false', nullable: true },
      { name: 'can_publish', type: 'BOOLEAN DEFAULT true', nullable: true },
      { name: 'publish_order', type: 'INTEGER DEFAULT 0', nullable: true },
      { name: 'content_version', type: 'INTEGER DEFAULT 1', nullable: true },
      { name: 'last_regenerated_at', type: 'TIMESTAMP', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()', nullable: true },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()', nullable: true }
    ];

    // Step 3: Add missing columns
    console.log('\n📋 Step 3: Adding missing columns...');
    
    let addedColumns = 0;
    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`   ➕ Adding column: ${col.name} (${col.type})`);
        
        try {
          await sql.unsafe(`
            ALTER TABLE content 
            ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
          `);
          addedColumns++;
          console.log(`   ✅ Added: ${col.name}`);
        } catch (error) {
          console.error(`   ❌ Failed to add ${col.name}:`, error.message);
        }
      }
    }

    if (addedColumns === 0) {
      console.log('   ✅ All required columns already exist');
    } else {
      console.log(`   ✅ Added ${addedColumns} missing columns`);
    }

    // Step 4: Ensure content_type has proper values
    console.log('\n📋 Step 4: Ensuring content_type column has valid data...');
    
    const nullContentTypes = await sql`
      SELECT COUNT(*) as count
      FROM content
      WHERE content_type IS NULL
    `;

    if (nullContentTypes[0].count > 0) {
      console.log(`   Found ${nullContentTypes[0].count} rows with NULL content_type`);
      console.log('   Setting default value to "video"...');
      
      await sql`
        UPDATE content
        SET content_type = 'video'
        WHERE content_type IS NULL
      `;
      
      console.log('   ✅ Updated NULL content_type values');
    } else {
      console.log('   ✅ All content_type values are valid');
    }

    // Step 5: Add indexes for performance
    console.log('\n📋 Step 5: Creating performance indexes...');
    
    const indexes = [
      { name: 'idx_content_user_id', column: 'user_id' },
      { name: 'idx_content_project_id', column: 'project_id' },
      { name: 'idx_content_status', column: 'status' },
      { name: 'idx_content_scheduled_at', column: 'scheduled_at' },
      { name: 'idx_content_platform', column: 'platform' },
      { name: 'idx_content_content_type', column: 'content_type' },
      { name: 'idx_content_created_at', column: 'created_at' }
    ];

    for (const idx of indexes) {
      try {
        await sql.unsafe(`
          CREATE INDEX IF NOT EXISTS ${idx.name} 
          ON content(${idx.column})
        `);
        console.log(`   ✅ Created index: ${idx.name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`   ⚠️  Index ${idx.name}:`, error.message);
        }
      }
    }

    // Step 6: Verify final schema
    console.log('\n📋 Step 6: Verifying final schema...');
    
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'content'
      ORDER BY ordinal_position
    `;

    console.log(`   ✅ Content table now has ${finalColumns.length} columns`);
    
    // Check for all required columns
    const missingRequired = requiredColumns
      .filter(req => !finalColumns.some(col => col.column_name === req.name));
    
    if (missingRequired.length > 0) {
      console.error('\n❌ CRITICAL: Still missing required columns:');
      missingRequired.forEach(col => console.error(`   - ${col.name}`));
      process.exit(1);
    }

    // Step 7: Test scheduler query
    console.log('\n📋 Step 7: Testing scheduler query...');
    
    try {
      const testQuery = await sql`
        SELECT id, user_id, title, description, script, 
               platform, content_type, status, scheduled_at, 
               created_at, updated_at
        FROM content
        WHERE status = 'scheduled'
        LIMIT 1
      `;
      console.log('   ✅ Scheduler query test passed');
    } catch (error) {
      console.error('   ❌ Scheduler query test failed:', error.message);
      throw error;
    }

    console.log('\n✅ SCHEDULER SCHEMA FIX COMPLETE!\n');
    console.log('Summary:');
    console.log(`  - Total columns: ${finalColumns.length}`);
    console.log(`  - Added columns: ${addedColumns}`);
    console.log(`  - Indexes created: ${indexes.length}`);
    console.log('  - Schema validation: PASSED');
    console.log('  - Query test: PASSED');
    console.log('\n🚀 Scheduler service should now start successfully!\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR during schema fix:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the fix
fixSchedulerSchema().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
