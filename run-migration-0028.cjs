/**
 * Run migration 0028 to fix schema_migrations table structure
 */

const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  console.log('🔌 Connecting to database...');
  console.log(`   URL: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);
  
  const sql = postgres(connectionString, {
    ssl: false,  // Local development
    max: 1,
    connect_timeout: 10
  });
  
  try {
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected successfully\n');
    
    // Check current schema_migrations structure
    console.log('📋 Checking current schema_migrations structure...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
      ORDER BY ordinal_position
    `;
    
    console.log(`Current columns: ${columns.map(c => c.column_name).join(', ')}\n`);
    
    const hasStatus = columns.some(c => c.column_name === 'status');
    const hasErrorMessage = columns.some(c => c.column_name === 'error_message');
    
    if (hasStatus && hasErrorMessage) {
      console.log('✅ schema_migrations table already has required columns');
      console.log('   No migration needed.');
      await sql.end();
      return;
    }
    
    // Read migration file
    console.log('📄 Reading migration 0028...');
    const migrationSQL = fs.readFileSync('migrations/0028_fix_schema_migrations_table_structure.sql', 'utf8');
    
    // Execute migration
    console.log('🚀 Executing migration 0028...\n');
    await sql.begin(async (tx) => {
      await tx.unsafe(migrationSQL);
    });
    
    console.log('✅ Migration 0028 completed successfully\n');
    
    // Verify changes
    console.log('🔍 Verifying changes...');
    const newColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
      ORDER BY ordinal_position
    `;
    
    console.log(`New columns: ${newColumns.map(c => c.column_name).join(', ')}\n`);
    
    const nowHasStatus = newColumns.some(c => c.column_name === 'status');
    const nowHasErrorMessage = newColumns.some(c => c.column_name === 'error_message');
    
    if (nowHasStatus && nowHasErrorMessage) {
      console.log('✅ Verification passed - all required columns present');
    } else {
      console.error('❌ Verification failed - columns still missing');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration().catch(console.error);
