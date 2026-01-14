/**
 * Run ALL migrations from scratch with proper tracking
 * This will execute all 29 migrations in order
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

async function runAllMigrations() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 RUNNING ALL MIGRATIONS FROM SCRATCH');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const sql = postgres(connectionString, {
    ssl: false,
    max: 1,
    connect_timeout: 10
  });
  
  try {
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected to database\n');
    
    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('.backup') && !file.includes('.disabled'))
      .sort();
    
    console.log(`📂 Found ${files.length} migration files\n`);
    
    // Check which migrations have already been executed
    const executed = await sql`
      SELECT filename, status FROM schema_migrations 
      ORDER BY executed_at
    `;
    
    const executedMap = new Map(executed.map(m => [m.filename, m.status]));
    console.log(`📊 ${executed.length} migrations already in tracking table\n`);
    
    let migrationsRun = 0;
    let migrationsSkipped = 0;
    const errors = [];
    
    // Execute each migration
    for (const filename of files) {
      const filepath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filepath, 'utf8');
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      // Check if already executed
      const existingStatus = executedMap.get(filename);
      if (existingStatus === 'completed') {
        console.log(`⏭️  Skipping ${filename} (already completed)`);
        migrationsSkipped++;
        continue;
      }
      
      console.log(`🚀 Executing ${filename}...`);
      const startTime = Date.now();
      
      try {
        // Record migration start
        await sql`
          INSERT INTO schema_migrations (filename, checksum, status)
          VALUES (${filename}, ${checksum}, 'running')
          ON CONFLICT (filename) DO UPDATE SET
            status = 'running',
            executed_at = NOW()
        `;
        
        // Execute migration in transaction
        await sql.begin(async (tx) => {
          await tx.unsafe(content);
        });
        
        const executionTime = Date.now() - startTime;
        
        // Mark as completed
        await sql`
          UPDATE schema_migrations 
          SET status = 'completed', 
              execution_time_ms = ${executionTime},
              executed_at = NOW(),
              error_message = NULL
          WHERE filename = ${filename}
        `;
        
        console.log(`✅ Completed in ${executionTime}ms\n`);
        migrationsRun++;
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error.message;
        
        console.error(`❌ Failed: ${errorMessage}\n`);
        
        // Mark as failed
        await sql`
          UPDATE schema_migrations 
          SET status = 'failed', 
              execution_time_ms = ${executionTime},
              error_message = ${errorMessage}
          WHERE filename = ${filename}
        `;
        
        errors.push(`${filename}: ${errorMessage}`);
        
        // Stop on first error
        break;
      }
    }
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════════════');
    if (errors.length === 0) {
      console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY');
    } else {
      console.log('💥 MIGRATION PROCESS FAILED');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   • Migrations executed: ${migrationsRun}`);
    console.log(`   • Migrations skipped: ${migrationsSkipped}`);
    console.log(`   • Total migrations: ${files.length}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors:`);
      errors.forEach(error => console.log(`   • ${error}`));
    }
    
    // Verify final schema
    console.log('\n🔍 Verifying final schema...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Database has ${tables.length} tables:`);
    tables.forEach(t => console.log(`   • ${t.table_name}`));
    
    // Check for content.script column specifically
    const contentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'content'
      ORDER BY ordinal_position
    `;
    
    if (contentColumns.length > 0) {
      const hasScript = contentColumns.some(c => c.column_name === 'script');
      console.log(`\n📋 Content table has ${contentColumns.length} columns`);
      console.log(`   script column: ${hasScript ? '✅ Present' : '❌ Missing'}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    
    if (errors.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runAllMigrations().catch(console.error);
