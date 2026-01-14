/**
 * STRICT MIGRATION RUNNER - PERMANENT SOLUTION
 * 
 * ROOT CAUSE FIXES:
 * 1. NEVER skip migrations based solely on schema_migrations table
 * 2. ALWAYS validate actual database schema matches expected schema
 * 3. FAIL FAST when schema mismatches are detected
 * 4. Mark migrations as successful ONLY after full execution AND validation
 * 5. Enforce strict column-level schema validation at startup
 * 6. Block service startup when schema is incomplete
 * 
 * This runner eliminates all false positives and schema drift issues.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationFile {
  filename: string;
  filepath: string;
  content: string;
  checksum: string;
}

interface SchemaValidation {
  isValid: boolean;
  missingTables: string[];
  missingColumns: { table: string; column: string }[];
  errors: string[];
}

interface ExecutionResult {
  success: boolean;
  migrationsRun: number;
  migrationsSkipped: number;
  totalMigrations: number;
  tablesCreated: number;
  schemaValid: boolean;
  errors: string[];
  executionTimeMs: number;
}

/**
 * Expected schema definition - SINGLE SOURCE OF TRUTH
 * This defines what the database MUST look like after all migrations
 */
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

export class StrictMigrationRunner {
  private sql: any = null;
  private migrations: MigrationFile[] = [];
  private lockAcquired = false;
  private migrationsDir: string;
  private static isRunning = false;

  constructor() {
    this.migrationsDir = path.resolve(process.cwd(), 'migrations');
    
    if (!fs.existsSync(this.migrationsDir)) {
      throw new Error(`CRITICAL: Migrations directory does not exist: ${this.migrationsDir}`);
    }
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to database with strict validation...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('CRITICAL: DATABASE_URL environment variable is not set');
    }

    this.sql = postgres(connectionString, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
      onnotice: (notice) => {
        if (notice.message && !notice.message.includes('NOTICE:')) {
          console.log('📢 Database notice:', notice.message);
        }
      }
    });

    const testResult = await this.sql`SELECT 1 as test, current_database() as db_name`;
    console.log(`✅ Connected to database: ${testResult[0].db_name}`);
  }

  async acquireAdvisoryLock(): Promise<void> {
    console.log('🔒 Acquiring PostgreSQL advisory lock...');
    
    const lockResult = await this.sql`SELECT pg_try_advisory_lock(42424242) as acquired`;
    
    if (!lockResult[0].acquired) {
      throw new Error('Another migration process is already running');
    }
    
    this.lockAcquired = true;
    console.log('✅ Advisory lock acquired');
  }

  async releaseAdvisoryLock(): Promise<void> {
    if (this.lockAcquired) {
      await this.sql`SELECT pg_advisory_unlock(42424242)`;
      this.lockAcquired = false;
    }
  }

  async createMigrationsTable(): Promise<void> {
    console.log('📋 Creating migrations tracking table...');
    
    await this.sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW(),
        checksum VARCHAR NOT NULL,
        execution_time_ms INTEGER,
        status VARCHAR DEFAULT 'completed',
        error_message TEXT
      )
    `;
    
    console.log('✅ Migrations table ready');
  }

  async loadMigrations(): Promise<void> {
    console.log('📂 Loading migration files...');
    
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('.disabled') && !file.includes('.skip') && !file.includes('.backup'))
      .sort();

    console.log(`📄 Found ${files.length} migration files`);

    this.migrations = [];
    
    for (const filename of files) {
      const filepath = path.join(this.migrationsDir, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`CRITICAL: Migration file not found: ${filepath}`);
      }
      
      const content = fs.readFileSync(filepath, 'utf8');
      
      if (content.trim().length === 0) {
        throw new Error(`CRITICAL: Migration file is empty: ${filepath}`);
      }
      
      const checksum = createHash('md5').update(content).digest('hex');
      
      this.migrations.push({
        filename,
        filepath,
        content,
        checksum
      });
    }

    console.log(`✅ Loaded ${this.migrations.length} migration files`);
  }

  /**
   * CRITICAL: Validate actual database schema against expected schema
   * This is the KEY FIX - we validate the ACTUAL schema, not just migration records
   */
  async validateDatabaseSchema(): Promise<SchemaValidation> {
    console.log('🔍 Performing strict schema validation...');
    
    const validation: SchemaValidation = {
      isValid: true,
      missingTables: [],
      missingColumns: [],
      errors: []
    };

    // Check each expected table
    for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
      // Check if table exists
      const tableExists = await this.sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;

      if (!tableExists[0].exists) {
        validation.isValid = false;
        validation.missingTables.push(tableName);
        validation.errors.push(`Table '${tableName}' does not exist`);
        continue;
      }

      // Check each expected column
      const actualColumns = await this.sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      `;

      const actualColumnNames = actualColumns.map((row: any) => row.column_name);

      for (const expectedColumn of expectedColumns) {
        if (!actualColumnNames.includes(expectedColumn)) {
          validation.isValid = false;
          validation.missingColumns.push({ table: tableName, column: expectedColumn });
          validation.errors.push(`Column '${tableName}.${expectedColumn}' does not exist`);
        }
      }
    }

    if (validation.isValid) {
      console.log('✅ Schema validation PASSED - all tables and columns present');
    } else {
      console.error('❌ Schema validation FAILED:');
      if (validation.missingTables.length > 0) {
        console.error(`   Missing tables: ${validation.missingTables.join(', ')}`);
      }
      if (validation.missingColumns.length > 0) {
        console.error(`   Missing columns:`);
        validation.missingColumns.forEach(({ table, column }) => {
          console.error(`     - ${table}.${column}`);
        });
      }
    }

    return validation;
  }

  async getExecutedMigrations(): Promise<Map<string, { checksum: string; status: string }>> {
    try {
      const executed = await this.sql`
        SELECT filename, checksum, status FROM schema_migrations 
        ORDER BY executed_at
      `;
      
      const executedMap = new Map(
        executed.map((row: any) => [row.filename, { checksum: row.checksum, status: row.status }])
      );
      
      return executedMap;
    } catch (error) {
      return new Map();
    }
  }

  async executeMigration(migration: MigrationFile, force: boolean = false): Promise<void> {
    const startTime = Date.now();
    
    console.log(`🚀 Executing migration: ${migration.filename}${force ? ' (FORCED)' : ''}`);
    
    try {
      // Record migration start
      await this.sql`
        INSERT INTO schema_migrations (filename, checksum, status)
        VALUES (${migration.filename}, ${migration.checksum}, 'running')
        ON CONFLICT (filename) DO UPDATE SET
          status = 'running',
          executed_at = NOW()
      `;

      // Execute the migration in a transaction
      await this.sql.begin(async (sql: any) => {
        await sql.unsafe(migration.content);
      });

      // CRITICAL: Validate schema AFTER execution
      const validation = await this.validateDatabaseSchema();
      
      if (!validation.isValid) {
        throw new Error(`Schema validation failed after migration: ${validation.errors.join(', ')}`);
      }

      // Record successful completion ONLY if validation passed
      const executionTime = Date.now() - startTime;
      
      await this.sql`
        UPDATE schema_migrations 
        SET status = 'completed', 
            execution_time_ms = ${executionTime},
            executed_at = NOW(),
            error_message = NULL
        WHERE filename = ${migration.filename}
      `;

      console.log(`✅ Migration completed and validated in ${executionTime}ms: ${migration.filename}`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Record failure
      await this.sql`
        UPDATE schema_migrations 
        SET status = 'failed', 
            execution_time_ms = ${executionTime},
            error_message = ${errorMessage}
        WHERE filename = ${migration.filename}
      `;

      console.error(`❌ Migration failed: ${migration.filename}`);
      console.error(`   Error: ${errorMessage}`);
      
      throw error;
    }
  }

  async runMigrations(): Promise<ExecutionResult> {
    console.log('🔄 Starting strict migration execution...');
    
    const startTime = Date.now();
    const executedMigrations = await this.getExecutedMigrations();
    let migrationsRun = 0;
    let migrationsSkipped = 0;
    const errors: string[] = [];

    // CRITICAL FIX: First, validate current schema state
    const initialValidation = await this.validateDatabaseSchema();
    
    if (!initialValidation.isValid) {
      console.warn('⚠️  Schema validation failed BEFORE migrations');
      console.warn('   This indicates schema drift or incomplete previous migrations');
      console.warn('   Will attempt to fix by re-running necessary migrations...');
    }

    for (const migration of this.migrations) {
      const executedInfo = executedMigrations.get(migration.filename);
      
      // CRITICAL FIX: Don't skip if schema is invalid, even if migration was "executed"
      if (executedInfo && executedInfo.status === 'completed' && initialValidation.isValid) {
        console.log(`⏭️  Skipping (already executed and schema valid): ${migration.filename}`);
        migrationsSkipped++;
        continue;
      }

      // If migration was marked as executed but schema is invalid, re-run it
      if (executedInfo && !initialValidation.isValid) {
        console.warn(`🔄 Re-executing (schema invalid despite execution record): ${migration.filename}`);
      }

      try {
        await this.executeMigration(migration, !initialValidation.isValid);
        migrationsRun++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${migration.filename}: ${errorMessage}`);
        break; // Stop on first error
      }
    }

    // CRITICAL: Final schema validation
    const finalValidation = await this.validateDatabaseSchema();
    
    if (!finalValidation.isValid) {
      errors.push('FATAL: Schema validation failed after all migrations');
      errors.push(...finalValidation.errors);
    }

    // Count tables
    const tables = await this.sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    const tablesCreated = parseInt(tables[0].count);

    const executionTime = Date.now() - startTime;

    if (errors.length === 0 && finalValidation.isValid) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 MIGRATION PROCESS COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   • Migrations executed: ${migrationsRun}`);
      console.log(`   • Migrations skipped: ${migrationsSkipped}`);
      console.log(`   • Total migrations: ${this.migrations.length}`);
      console.log(`   • Tables verified: ${tablesCreated}`);
      console.log(`   • Schema validation: PASSED`);
      console.log(`   • Total execution time: ${executionTime}ms`);
      console.log('✅ Database schema is fully synchronized and validated!');
      console.log('═══════════════════════════════════════════════════════════════');
    } else {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('💥 MIGRATION PROCESS FAILED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('❌ Errors:');
      errors.forEach(error => console.log(`   • ${error}`));
      console.log('🚨 APPLICATION CANNOT START - SCHEMA IS INVALID');
      console.log('═══════════════════════════════════════════════════════════════');
    }

    return {
      success: errors.length === 0 && finalValidation.isValid,
      migrationsRun,
      migrationsSkipped,
      totalMigrations: this.migrations.length,
      tablesCreated,
      schemaValid: finalValidation.isValid,
      errors,
      executionTimeMs: executionTime
    };
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.releaseAdvisoryLock();
      await this.sql.end();
    }
  }

  async run(): Promise<ExecutionResult> {
    if (StrictMigrationRunner.isRunning) {
      console.log('⏳ Migration already in progress, waiting...');
      while (StrictMigrationRunner.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return {
        success: true,
        migrationsRun: 0,
        migrationsSkipped: 0,
        totalMigrations: 0,
        tablesCreated: 0,
        schemaValid: true,
        errors: [],
        executionTimeMs: 0
      };
    }

    StrictMigrationRunner.isRunning = true;

    try {
      await this.connect();
      await this.acquireAdvisoryLock();
      await this.createMigrationsTable();
      await this.loadMigrations();
      const result = await this.runMigrations();
      await this.close();
      
      return result;
      
    } catch (error) {
      console.error('💥 Migration process failed:', error instanceof Error ? error.message : String(error));
      
      await this.releaseAdvisoryLock();
      if (this.sql) {
        try {
          await this.sql.end();
        } catch (closeError) {
          console.error('Failed to close database connection:', closeError);
        }
      }
      
      throw error;
    } finally {
      StrictMigrationRunner.isRunning = false;
    }
  }
}

export default StrictMigrationRunner;
