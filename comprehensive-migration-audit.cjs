/**
 * COMPREHENSIVE MIGRATION SYSTEM AUDIT
 * 
 * This script performs a complete audit of the migration system to identify:
 * 1. Schema drift between expected and actual schema
 * 2. Migration execution history and anomalies
 * 3. Missing columns, tables, and constraints
 * 4. Migration file integrity issues
 * 5. Root causes of schema validation failures
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db', {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false
});

// Expected schema from strictMigrationRunner.ts
const MINIMUM_REQUIRED_SCHEMA = {
  users: ['id', 'email', 'created_at'],
  projects: ['id', 'user_id', 'name', 'created_at'],
  content: ['id', 'user_id', 'title', 'platform', 'status', 'created_at'],
  content_metrics: ['id', 'content_id'],
  post_schedules: ['id', 'platform', 'scheduled_at', 'status'],
  schema_migrations: ['id', 'filename', 'executed_at']
};

// Additional columns mentioned in error messages
const ADDITIONAL_EXPECTED_COLUMNS = {
  content: ['content_type', 'published_at', 'thumbnail_url', 'video_url', 'tags', 'metadata', 'ai_generated'],
  content_metrics: ['created_at']
};

async function auditMigrationSystem() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 COMPREHENSIVE MIGRATION SYSTEM AUDIT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const audit = {
    timestamp: new Date().toISOString(),
    database: {},
    migrations: {},
    schema: {},
    rootCauses: [],
    recommendations: []
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1: DATABASE CONNECTION AND METADATA
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📊 SECTION 1: Database Metadata');
    console.log('─'.repeat(65));
    
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `;
    
    audit.database = {
      name: dbInfo[0].database_name,
      user: dbInfo[0].current_user,
      version: dbInfo[0].postgres_version
    };
    
    console.log(`Database: ${audit.database.name}`);
    console.log(`User: ${audit.database.user}`);
    console.log(`Version: ${audit.database.version}\n`);

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2: MIGRATION EXECUTION HISTORY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📋 SECTION 2: Migration Execution History');
    console.log('─'.repeat(65));
    
    const migrationHistory = await sql`
      SELECT 
        filename,
        executed_at,
        status,
        execution_time_ms,
        error_message,
        checksum
      FROM schema_migrations
      ORDER BY executed_at
    `;
    
    audit.migrations.history = migrationHistory;
    audit.migrations.totalExecuted = migrationHistory.length;
    audit.migrations.failed = migrationHistory.filter(m => m.status === 'failed').length;
    audit.migrations.completed = migrationHistory.filter(m => m.status === 'completed').length;
    
    console.log(`Total migrations executed: ${audit.migrations.totalExecuted}`);
    console.log(`Completed: ${audit.migrations.completed}`);
    console.log(`Failed: ${audit.migrations.failed}\n`);
    
    if (migrationHistory.length > 0) {
      console.log('Migration History:');
      migrationHistory.forEach(m => {
        const status = m.status === 'completed' ? '✅' : '❌';
        console.log(`  ${status} ${m.filename} (${m.executed_at.toISOString().split('T')[0]})`);
        if (m.error_message) {
          console.log(`     Error: ${m.error_message}`);
        }
      });
      console.log('');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3: MIGRATION FILE INTEGRITY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📁 SECTION 3: Migration File Integrity');
    console.log('─'.repeat(65));
    
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.includes('.retired') && !f.includes('.disabled'))
      .sort();
    
    audit.migrations.filesOnDisk = migrationFiles.length;
    audit.migrations.files = [];
    
    console.log(`Migration files on disk: ${migrationFiles.length}\n`);
    
    const executedMap = new Map(migrationHistory.map(m => [m.filename, m]));
    
    for (const filename of migrationFiles) {
      const filepath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filepath, 'utf8');
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      const executed = executedMap.get(filename);
      
      const fileInfo = {
        filename,
        checksum,
        executed: !!executed,
        checksumMatch: executed ? executed.checksum === checksum : null,
        status: executed?.status || 'not executed',
        size: content.length
      };
      
      audit.migrations.files.push(fileInfo);
      
      const statusIcon = fileInfo.executed ? '✅' : '⏸️ ';
      const checksumIcon = fileInfo.checksumMatch === false ? ' ⚠️  MODIFIED' : '';
      console.log(`  ${statusIcon} ${filename}${checksumIcon}`);
      
      if (fileInfo.checksumMatch === false) {
        audit.rootCauses.push({
          type: 'MIGRATION_MODIFIED_AFTER_EXECUTION',
          severity: 'CRITICAL',
          migration: filename,
          description: 'Migration file was modified after being executed',
          impact: 'Schema drift - database state does not match migration file'
        });
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4: ACTUAL DATABASE SCHEMA
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('🗄️  SECTION 4: Actual Database Schema');
    console.log('─'.repeat(65));
    
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    audit.schema.tables = [];
    
    console.log(`Total tables: ${tables.length}\n`);
    
    for (const { table_name } of tables) {
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${table_name}
        ORDER BY ordinal_position
      `;
      
      const tableInfo = {
        name: table_name,
        columns: columns.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default
        }))
      };
      
      audit.schema.tables.push(tableInfo);
      
      console.log(`Table: ${table_name} (${columns.length} columns)`);
      columns.forEach(c => {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  - ${c.column_name}: ${c.data_type} ${nullable}`);
      });
      console.log('');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5: SCHEMA VALIDATION AGAINST EXPECTED SCHEMA
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('✅ SECTION 5: Schema Validation');
    console.log('─'.repeat(65));
    
    audit.schema.validation = {
      missingTables: [],
      missingColumns: [],
      extraTables: [],
      valid: true
    };
    
    // Check minimum required schema
    for (const [tableName, requiredColumns] of Object.entries(MINIMUM_REQUIRED_SCHEMA)) {
      const tableExists = tables.some(t => t.table_name === tableName);
      
      if (!tableExists) {
        audit.schema.validation.missingTables.push(tableName);
        audit.schema.validation.valid = false;
        console.log(`❌ Missing table: ${tableName}`);
        
        audit.rootCauses.push({
          type: 'MISSING_TABLE',
          severity: 'CRITICAL',
          table: tableName,
          description: `Required table '${tableName}' does not exist`,
          impact: 'Application cannot function without this table'
        });
        continue;
      }
      
      const tableInfo = audit.schema.tables.find(t => t.name === tableName);
      const actualColumns = tableInfo.columns.map(c => c.name);
      
      for (const requiredColumn of requiredColumns) {
        if (!actualColumns.includes(requiredColumn)) {
          audit.schema.validation.missingColumns.push({ table: tableName, column: requiredColumn });
          audit.schema.validation.valid = false;
          console.log(`❌ Missing column: ${tableName}.${requiredColumn}`);
          
          audit.rootCauses.push({
            type: 'MISSING_COLUMN',
            severity: 'CRITICAL',
            table: tableName,
            column: requiredColumn,
            description: `Required column '${tableName}.${requiredColumn}' does not exist`,
            impact: 'Schema validation will fail, application cannot start'
          });
        }
      }
    }
    
    // Check additional expected columns from error messages
    for (const [tableName, additionalColumns] of Object.entries(ADDITIONAL_EXPECTED_COLUMNS)) {
      const tableInfo = audit.schema.tables.find(t => t.name === tableName);
      if (!tableInfo) continue;
      
      const actualColumns = tableInfo.columns.map(c => c.name);
      
      for (const column of additionalColumns) {
        if (!actualColumns.includes(column)) {
          audit.schema.validation.missingColumns.push({ table: tableName, column });
          audit.schema.validation.valid = false;
          console.log(`❌ Missing column (from error): ${tableName}.${column}`);
          
          audit.rootCauses.push({
            type: 'MISSING_COLUMN_FROM_ERROR',
            severity: 'HIGH',
            table: tableName,
            column,
            description: `Column '${tableName}.${column}' mentioned in error messages does not exist`,
            impact: 'Application code expects this column but it is missing'
          });
        }
      }
    }
    
    if (audit.schema.validation.valid) {
      console.log('✅ Schema validation PASSED\n');
    } else {
      console.log(`\n❌ Schema validation FAILED`);
      console.log(`   Missing tables: ${audit.schema.validation.missingTables.length}`);
      console.log(`   Missing columns: ${audit.schema.validation.missingColumns.length}\n`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 6: ROOT CAUSE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('🔬 SECTION 6: Root Cause Analysis');
    console.log('─'.repeat(65));
    
    // Analyze why migrations were skipped
    const skippedMigrations = migrationFiles.filter(f => !executedMap.has(f));
    if (skippedMigrations.length > 0) {
      console.log(`\n⚠️  ${skippedMigrations.length} migrations were never executed:`);
      skippedMigrations.forEach(f => console.log(`   - ${f}`));
      
      audit.rootCauses.push({
        type: 'MIGRATIONS_NEVER_EXECUTED',
        severity: 'HIGH',
        migrations: skippedMigrations,
        description: 'Some migration files exist but were never executed',
        impact: 'Schema is incomplete, missing tables/columns from these migrations'
      });
    }
    
    // Analyze migration execution order
    const executionOrder = migrationHistory.map(m => m.filename);
    const expectedOrder = migrationFiles;
    const orderMismatch = executionOrder.some((f, i) => f !== expectedOrder[i]);
    
    if (orderMismatch) {
      console.log(`\n⚠️  Migration execution order does not match file order`);
      console.log(`   Expected: ${expectedOrder.slice(0, 3).join(', ')}...`);
      console.log(`   Actual: ${executionOrder.slice(0, 3).join(', ')}...`);
      
      audit.rootCauses.push({
        type: 'MIGRATION_ORDER_MISMATCH',
        severity: 'MEDIUM',
        description: 'Migrations were executed in different order than file names suggest',
        impact: 'May cause dependency issues if migrations depend on each other'
      });
    }
    
    // Check for baseline migration issues
    const baseline = executedMap.get('0000_nice_forgotten_one.sql');
    if (!baseline) {
      console.log(`\n❌ Baseline migration (0000) was never executed`);
      
      audit.rootCauses.push({
        type: 'MISSING_BASELINE',
        severity: 'CRITICAL',
        description: 'Baseline migration 0000_nice_forgotten_one.sql was never executed',
        impact: 'Extensions and schema_migrations table may not be properly initialized'
      });
    }
    
    // Check for core tables migration
    const coreTables = executedMap.get('0001_core_tables_idempotent.sql');
    if (!coreTables) {
      console.log(`\n❌ Core tables migration (0001) was never executed`);
      
      audit.rootCauses.push({
        type: 'MISSING_CORE_TABLES_MIGRATION',
        severity: 'CRITICAL',
        description: 'Core tables migration 0001_core_tables_idempotent.sql was never executed',
        impact: 'Core tables (users, projects, content, etc.) may not exist'
      });
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 7: RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('💡 SECTION 7: Recommendations');
    console.log('─'.repeat(65));
    
    if (audit.schema.validation.missingTables.length > 0) {
      audit.recommendations.push({
        priority: 'CRITICAL',
        action: 'Execute missing migrations to create required tables',
        details: `Missing tables: ${audit.schema.validation.missingTables.join(', ')}`
      });
    }
    
    if (audit.schema.validation.missingColumns.length > 0) {
      audit.recommendations.push({
        priority: 'CRITICAL',
        action: 'Create corrective migration to add missing columns',
        details: `Missing ${audit.schema.validation.missingColumns.length} columns across multiple tables`
      });
    }
    
    if (skippedMigrations.length > 0) {
      audit.recommendations.push({
        priority: 'HIGH',
        action: 'Execute all pending migrations in correct order',
        details: `${skippedMigrations.length} migrations have never been executed`
      });
    }
    
    const modifiedMigrations = audit.migrations.files.filter(f => f.checksumMatch === false);
    if (modifiedMigrations.length > 0) {
      audit.recommendations.push({
        priority: 'HIGH',
        action: 'Investigate modified migrations and create corrective migrations',
        details: `${modifiedMigrations.length} migrations were modified after execution`
      });
    }
    
    audit.recommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`   ${rec.details}`);
    });
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 8: SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Database: ${audit.database.name}`);
    console.log(`Tables: ${audit.schema.tables.length}`);
    console.log(`Migrations executed: ${audit.migrations.totalExecuted}`);
    console.log(`Migrations on disk: ${audit.migrations.filesOnDisk}`);
    console.log(`Schema valid: ${audit.schema.validation.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`Root causes identified: ${audit.rootCauses.length}`);
    console.log(`Recommendations: ${audit.recommendations.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save audit report
    const reportPath = 'migration-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));
    console.log(`📄 Full audit report saved to: ${reportPath}\n`);

  } catch (error) {
    console.error('💥 Audit failed:', error);
    audit.error = error.message;
  } finally {
    await sql.end();
  }

  return audit;
}

auditMigrationSystem().then(audit => {
  process.exit(audit.schema?.validation?.valid ? 0 : 1);
});
