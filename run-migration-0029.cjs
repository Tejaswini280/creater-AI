#!/usr/bin/env node

/**
 * Run migration 0029 to add content_metrics.created_at
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running migration 0029_add_content_metrics_created_at.sql');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    max: 1
  });

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '0029_add_content_metrics_created_at.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Execute migration
    await sql.begin(async (sql) => {
      await sql.unsafe(migrationSQL);
    });
    
    console.log('✅ Migration executed successfully');
    
    // Record in schema_migrations
    await sql`
      INSERT INTO schema_migrations (filename, checksum, status, execution_time_ms)
      VALUES ('0029_add_content_metrics_created_at.sql', 'manual', 'completed', 0)
      ON CONFLICT (filename) DO UPDATE SET
        status = 'completed',
        executed_at = NOW()
    `;
    
    console.log('✅ Migration recorded in schema_migrations');
    
    // Verify the column was added
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'content_metrics'
        AND column_name = 'created_at'
      ) as exists
    `;
    
    if (exists[0].exists) {
      console.log('✅ Verification passed: content_metrics.created_at exists');
    } else {
      console.error('❌ Verification failed: content_metrics.created_at does not exist');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration().catch(console.error);
