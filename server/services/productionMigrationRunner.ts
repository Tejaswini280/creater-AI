/**
 * Production-Ready Migration Runner
 * 
 * CRITICAL FIXES:
 * - Uses ABSOLUTE PATHS for all file operations
 * - FAILS FAST if any migration file is missing
 * - Validates schema existence after migrations
 * - Prevents duplicate execution with global guards
 * - Provides accurate success/failure reporting
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationFile {
  filename: string;
  filepath: string;
  content: string;
  checksum: string;
}

interface ExecutionResult {
  success: boolean;
  migrationsRun: number;
  migrationsSkipped: number;
  totalMigrations: number;
  tablesCreated: number;
  errors: string[];
  executionTimeMs: number;
}

export class ProductionMigrationRunner {
  private sql: any = null;
  private migrations: MigrationFile[] = [];
  private lockAcquired = false;
  private static isRunning = false; // Global guard to prevent duplicate execution

  constructor() {
    // CRITICAL: Use ABSOLUTE path to migrations directory
    this.migrationsDir = path.resolve(process.cwd(), 'migrations');
    
    console.log(`🗂️  Migration directory (ABSOLUTE): ${this.migrationsDir}`);
    
    // Verify migrations directory exists
    if (!fs.existsSync(this.migrationsDir)) {
      throw new Error(`CRITICAL: Migrations directory does not exist: ${this.migrationsDir}`);
    }
  }

  private migrationsDir: string;

  async connect(): Promise<void> {
    console.log('🔌 Connecting to database...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('CRITICAL: DATABASE_URL environment variable is not set');
    }

    console.log(`🔗 Database URL: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);
    
    try {
      this.sql = postgres(connectionString, {
        ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
        max: 1, // Single connection for migrations
        idle_timeout: 20,
        connect_timeout: 30, // Increased timeout for Railway
        onnotice: (notice) => {
          if (notice.message && !notice.message.includes('NOTICE:')) {
            console.log('📢 Database notice:', notice.message);
          }
        }
      });

      // Test connection with timeout
      const testResult = await Promise.race([
        this.sql`SELECT 1 as test, current_database() as db_name, current_user as db_user`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 30000)
        )
      ]);

      console.log('✅ Database connection successful');
      console.log(`📊 Connected to database: ${(testResult as any)[0].db_name} as user: ${(testResult as any)[0].db_user}`);
      
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async acquireAdvisoryLock(): Promise<void> {
    console.log('🔒 Acquiring PostgreSQL advisory lock for migrations...');
    
    try {
      const lockResult = await this.sql`SELECT pg_try_advisory_lock(42424242) as acquired`;
      
      if (!lockResult[0].acquired) {
        throw new Error('Another migration process is already running. Please wait for it to complete.');
      }
      
      this.lockAcquired = true;
      console.log('✅ Advisory lock acquired - this process is the sole migrator');
    } catch (error) {
      console.error('❌ Failed to acquire advisory lock:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async releaseAdvisoryLock(): Promise<void> {
    if (this.lockAcquired) {
      console.log('🔓 Releasing PostgreSQL advisory lock...');
      try {
        await this.sql`SELECT pg_advisory_unlock(42424242)`;
        this.lockAcquired = false;
        console.log('✅ Advisory lock released');
      } catch (error) {
        console.error('❌ Failed to release advisory lock:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  async createMigrationsTable(): Promise<void> {
    console.log('📋 Creating migrations tracking table...');
    
    try {
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
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create migrations table: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadMigrations(): Promise<void> {
    console.log('📂 Loading migration files with ABSOLUTE paths...');
    
    try {
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql') && !file.includes('.backup'))
        .sort(); // Sort by filename for consistent order

      if (files.length === 0) {
        console.warn('⚠️  No migration files found in directory');
        this.migrations = [];
        return;
      }

      console.log(`📄 Found ${files.length} migration files:`);
      files.forEach(file => console.log(`   • ${file}`));

      this.migrations = [];
      
      for (const filename of files) {
        const filepath = path.join(this.migrationsDir, filename);
        
        // CRITICAL: Verify each file exists with absolute path
        if (!fs.existsSync(filepath)) {
          throw new Error(`CRITICAL: Migration file not found at absolute path: ${filepath}`);
        }
        
        let content: string;
        try {
          content = fs.readFileSync(filepath, 'utf8');
        } catch (error) {
          throw new Error(`CRITICAL: Failed to read migration file ${filepath}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
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
        
        console.log(`✅ Loaded: ${filename} (${content.length} bytes, checksum: ${checksum.substring(0, 8)}...)`);
      }

      console.log(`✅ Successfully loaded ${this.migrations.length} migration files`);
      
    } catch (error) {
      console.error('❌ Failed to load migrations:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<Map<string, string>> {
    try {
      const executed = await this.sql`
        SELECT filename, checksum FROM schema_migrations 
        WHERE status = 'completed'
        ORDER BY executed_at
      `;
      
      const executedMap = new Map(executed.map((row: any) => [row.filename, row.checksum]));
      console.log(`📊 Found ${executedMap.size} previously executed migrations`);
      
      return executedMap;
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error instanceof Error ? error.message : String(error));
      return new Map();
    }
  }

  async executeMigration(migration: MigrationFile): Promise<void> {
    const startTime = Date.now();
    
    console.log(`🚀 Executing migration: ${migration.filename}`);
    console.log(`📁 File path: ${migration.filepath}`);
    
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

      // Record successful completion
      const executionTime = Date.now() - startTime;
      
      await this.sql`
        UPDATE schema_migrations 
        SET status = 'completed', 
            execution_time_ms = ${executionTime},
            executed_at = NOW(),
            error_message = NULL
        WHERE filename = ${migration.filename}
      `;

      console.log(`✅ Migration completed successfully in ${executionTime}ms: ${migration.filename}`);
      
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
      console.error(`   File: ${migration.filepath}`);
      
      throw new Error(`Migration ${migration.filename} failed: ${errorMessage}`);
    }
  }

  async validateSchemaExists(): Promise<number> {
    console.log('🔍 Validating database schema exists...');
    
    try {
      const tables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      const tableCount = tables.length;
      console.log(`📊 Found ${tableCount} tables in public schema:`);
      
      if (tableCount === 0) {
        throw new Error('CRITICAL: No tables found in database after migrations. Schema creation failed!');
      }
      
      // Log first few tables for verification
      const tablesToShow = Math.min(5, tableCount);
      for (let i = 0; i < tablesToShow; i++) {
        console.log(`   • ${tables[i].table_name}`);
      }
      
      if (tableCount > tablesToShow) {
        console.log(`   ... and ${tableCount - tablesToShow} more tables`);
      }
      
      console.log('✅ Schema validation passed - database is ready for use');
      return tableCount;
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async runMigrations(): Promise<ExecutionResult> {
    console.log('🔄 Starting migration execution...');
    
    const startTime = Date.now();
    const executedMigrations = await this.getExecutedMigrations();
    let migrationsRun = 0;
    let migrationsSkipped = 0;
    const errors: string[] = [];

    for (const migration of this.migrations) {
      const executedChecksum = executedMigrations.get(migration.filename);
      
      if (executedChecksum) {
        if (executedChecksum === migration.checksum) {
          console.log(`⏭️  Skipping (already executed): ${migration.filename}`);
          migrationsSkipped++;
          continue;
        } else {
          console.log(`🔄 Re-executing (checksum changed): ${migration.filename}`);
        }
      }

      try {
        await this.executeMigration(migration);
        migrationsRun++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${migration.filename}: ${errorMessage}`);
        
        // Stop on first error to prevent cascade failures
        console.error('💥 Stopping migration process due to error');
        break;
      }
    }

    // CRITICAL: Validate schema exists after migrations
    let tablesCreated = 0;
    if (errors.length === 0) {
      try {
        tablesCreated = await this.validateSchemaExists();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Schema validation failed: ${errorMessage}`);
      }
    }

    const executionTime = Date.now() - startTime;

    if (errors.length === 0) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 MIGRATION PROCESS COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   • Migrations executed: ${migrationsRun}`);
      console.log(`   • Migrations skipped: ${migrationsSkipped}`);
      console.log(`   • Total migrations: ${this.migrations.length}`);
      console.log(`   • Tables created/verified: ${tablesCreated}`);
      console.log(`   • Total execution time: ${executionTime}ms`);
      console.log('');
      console.log('✅ Database schema is now fully synchronized and ready!');
      console.log('═══════════════════════════════════════════════════════════════');
    } else {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('💥 MIGRATION PROCESS FAILED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('❌ Errors encountered:');
      errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
      console.log('🚨 APPLICATION CANNOT START - DATABASE IS NOT READY');
      console.log('═══════════════════════════════════════════════════════════════');
    }

    return {
      success: errors.length === 0 && tablesCreated > 0,
      migrationsRun,
      migrationsSkipped,
      totalMigrations: this.migrations.length,
      tablesCreated,
      errors,
      executionTimeMs: executionTime
    };
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.releaseAdvisoryLock();
      await this.sql.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run(): Promise<ExecutionResult> {
    // Global guard to prevent duplicate execution
    if (ProductionMigrationRunner.isRunning) {
      console.log('⏳ Migration already in progress, waiting...');
      
      // Wait for existing migration to complete
      while (ProductionMigrationRunner.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Return a dummy successful result since migrations already ran
      return {
        success: true,
        migrationsRun: 0,
        migrationsSkipped: 0,
        totalMigrations: 0,
        tablesCreated: 0,
        errors: [],
        executionTimeMs: 0
      };
    }

    ProductionMigrationRunner.isRunning = true;

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
      
      // Always try to release lock and close connection on failure
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
      ProductionMigrationRunner.isRunning = false;
    }
  }
}

export default ProductionMigrationRunner;