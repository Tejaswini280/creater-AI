/**
 * Check the actual structure of the schema_migrations table
 */

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1
});

async function check() {
  try {
    console.log('🔍 Checking schema_migrations table structure...\n');
    
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      ) as exists
    `;
    
    if (!tableExists[0].exists) {
      console.log('❌ schema_migrations table does NOT exist');
      await sql.end();
      return;
    }
    
    console.log('✅ schema_migrations table exists\n');
    
    // Get all columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
      ORDER BY ordinal_position
    `;
    
    console.log(`Columns in schema_migrations table (${columns.length}):\n`);
    columns.forEach(col => {
      console.log(`  - ${col.column_name}`);
      console.log(`    Type: ${col.data_type}`);
      console.log(`    Nullable: ${col.is_nullable}`);
      console.log(`    Default: ${col.column_default || 'none'}`);
      console.log('');
    });
    
    // Get all records
    const records = await sql`
      SELECT * FROM schema_migrations ORDER BY executed_at
    `;
    
    console.log(`\nTotal migration records: ${records.length}\n`);
    
    if (records.length > 0) {
      console.log('Migration records:');
      records.forEach((rec, idx) => {
        console.log(`\n${idx + 1}. ${rec.filename}`);
        console.log(`   Executed: ${rec.executed_at}`);
        console.log(`   Checksum: ${rec.checksum?.substring(0, 8)}...`);
        if (rec.execution_time_ms) {
          console.log(`   Time: ${rec.execution_time_ms}ms`);
        }
        if (rec.status) {
          console.log(`   Status: ${rec.status}`);
        }
        if (rec.error_message) {
          console.log(`   Error: ${rec.error_message}`);
        }
      });
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const expectedColumns = ['id', 'filename', 'executed_at', 'checksum', 'execution_time_ms', 'status', 'error_message'];
    const actualColumnNames = columns.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ MISSING COLUMNS in schema_migrations table:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('\nThis explains why migrations are being skipped!');
      console.log('The migration runner expects these columns but they don\'t exist.');
      console.log('\nSOLUTION: Run a migration to add missing columns to schema_migrations table.');
    } else {
      console.log('✅ All expected columns are present in schema_migrations table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sql.end();
  }
}

check().catch(console.error);
