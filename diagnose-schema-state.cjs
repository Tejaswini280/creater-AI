#!/usr/bin/env node

/**
 * COMPREHENSIVE SCHEMA DIAGNOSIS
 * 
 * This script will:
 * 1. Connect to the database
 * 2. List all tables
 * 3. List all columns for each table
 * 4. Check migration records
 * 5. Identify the root cause of schema drift
 */

const postgres = require('postgres');

async function diagnoseSchema() {
  console.log('🔍 COMPREHENSIVE SCHEMA DIAGNOSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  
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
    // 1. Check database connection
    const dbInfo = await sql`SELECT current_database() as db, current_user as user, version()`;
    console.log(`\n✅ Connected to: ${dbInfo[0].db} as ${dbInfo[0].user}`);
    console.log(`   PostgreSQL: ${dbInfo[0].version.split(',')[0]}`);

    // 2. List all tables
    console.log('\n📊 TABLES IN DATABASE:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`   • ${t.table_name}`));

    // 3. Check critical tables and their columns
    console.log('\n📋 CRITICAL TABLE COLUMNS:');
    
    const criticalTables = ['users', 'projects', 'content', 'content_metrics', 'post_schedules'];
    
    for (const tableName of criticalTables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;

      if (!tableExists[0].exists) {
        console.log(`\n   ❌ Table '${tableName}' DOES NOT EXIST`);
        continue;
      }

      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;

      console.log(`\n   ✅ Table '${tableName}' (${columns.length} columns):`);
      columns.forEach(col => {
        console.log(`      • ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // 4. Check migration records
    console.log('\n📝 MIGRATION RECORDS:');
    
    const migrationTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      ) as exists
    `;

    if (!migrationTableExists[0].exists) {
      console.log('   ❌ schema_migrations table DOES NOT EXIST');
    } else {
      const migrations = await sql`
        SELECT filename, status, executed_at, error_message
        FROM schema_migrations 
        ORDER BY executed_at
      `;

      console.log(`   Found ${migrations.length} migration records:`);
      migrations.forEach(m => {
        const status = m.status === 'completed' ? '✅' : '❌';
        console.log(`   ${status} ${m.filename} (${m.status}) - ${m.executed_at}`);
        if (m.error_message) {
          console.log(`      Error: ${m.error_message}`);
        }
      });
    }

    // 5. Check for specific missing columns reported in error
    console.log('\n🔍 CHECKING REPORTED MISSING COLUMNS:');
    
    const missingColumns = [
      { table: 'projects', column: 'name' },
      { table: 'content', column: 'content_type' },
      { table: 'content', column: 'published_at' },
      { table: 'content', column: 'thumbnail_url' },
      { table: 'content', column: 'video_url' },
      { table: 'content', column: 'tags' },
      { table: 'content', column: 'metadata' },
      { table: 'content', column: 'ai_generated' },
      { table: 'content_metrics', column: 'created_at' }
    ];

    for (const { table, column } of missingColumns) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
          AND column_name = ${column}
        ) as exists
      `;

      const status = exists[0].exists ? '✅ EXISTS' : '❌ MISSING';
      console.log(`   ${status}: ${table}.${column}`);
    }

    // 6. Root cause analysis
    console.log('\n🔬 ROOT CAUSE ANALYSIS:');
    console.log('   Checking if migrations were executed but didn\'t create columns...');
    
    // Check if 0001 migration was executed
    const migration0001 = await sql`
      SELECT * FROM schema_migrations WHERE filename = '0001_core_tables_clean.sql'
    `;
    
    if (migration0001.length > 0) {
      console.log(`   ✅ Migration 0001_core_tables_clean.sql was executed at ${migration0001[0].executed_at}`);
      console.log(`      Status: ${migration0001[0].status}`);
      
      // But check if it actually created the columns
      const projectsNameExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'projects'
          AND column_name = 'name'
        ) as exists
      `;
      
      if (!projectsNameExists[0].exists) {
        console.log('   ❌ PROBLEM FOUND: Migration 0001 was marked as executed but did NOT create projects.name column');
        console.log('   🔍 This indicates the migration was skipped or failed silently');
      }
    } else {
      console.log('   ❌ Migration 0001_core_tables_clean.sql was NEVER executed');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Diagnosis complete');
    
  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

diagnoseSchema().catch(console.error);
