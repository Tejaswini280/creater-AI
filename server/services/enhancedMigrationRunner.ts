/**
 * Enhanced Migration Runner with Dependency Resolution
 * 
 * This enhanced migration runner uses dependency analysis to ensure migrations
 * execute in the correct order, preventing circular dependency issues.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { MigrationDependencyResolver, type MigrationFile, type ValidationResult } from './migrationDependencyResolver.ts';

interface MigrationConfig {
  connectionString: string;
  migrationsDir: string;
  maxRetries: number;
  retryDelay: number;
  ssl: boolean | string;
  max: number;
  idle_timeout: number;
  connect_timeout: number;
}

interface ExecutionResult {
  success: boolean;
  migrationsRun: number;
  migrationsSkipped: number;
  totalMigrations: number;
  errors: string[];
  executionTimeMs: number;
}

export class EnhancedMigrationRunner {
  private sql: any = null;
  private migrations: MigrationFile[] = [];
  private lockAcquired = false;
  private dependencyResolver: MigrationDependencyResolver;
  private config: MigrationConfig;

  constructor(config?: Partial<MigrationConfig>) {
    this.dependencyResolver = new MigrationDependencyResolver();
    
    this.config = {
      connectionString: process.env.DATABASE_URL || 
        `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
      migrationsDir: path.join(process.cwd(), 'migrations'),
      maxRetries: 3,
      retryDelay: 2000,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ...config
    };
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to database...');
    
    try {
      this.sql = postgres(this.config.connectionString, {
        ssl: this.config.ssl,
        max: this.config.max,
        idle_timeout: this.config.idle_timeout,
        connect_timeout: this.config.connect_timeout,
        onnotice: (notice) => {
          if (notice.message && !notice.message.includes('NOTICE:')) {
            console.log('📢 Database notice:', notice.message);
          }
        }
      });

      // Test connection
      await this.sql`SELECT 1`;
      console.log('✅ Database connection successful');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async acquireAdvisoryLock(): Promise<void> {
    console.log('🔒 Acquiring PostgreSQL advisory lock for migrations...');
    
    try {
      await this.sql`SELECT pg_advisory_lock(42424242)`;
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
      // First, create the basic table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR NOT NULL,
          execution_time_ms INTEGER
        )
      `;

      // Then add the enhanced columns if they don't exist
      await this.sql`
        ALTER TABLE schema_migrations 
        ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'completed',
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS recovery_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS metadata JSONB
      `;
      
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async loadMigrations(): Promise<void> {
    console.log('📂 Loading migration files...');
    
    try {
      const files = fs.readdirSync(this.config.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Initial sort by filename

      this.migrations = files.map(filename => {
        const filepath = path.join(this.config.migrationsDir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const checksum = createHash('md5').update(content).digest('hex');
        
        return {
          filename,
          filepath,
          content,
          checksum,
          dependencies: [],
          creates: [],
          references: [],
          order: 0
        };
      });

      console.log(`✅ Loaded ${this.migrations.length} migration files`);
      this.migrations.forEach(m => console.log(`   📄 ${m.filename}`));
      
    } catch (error) {
      console.error('❌ Failed to load migrations:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async analyzeDependencies(): Promise<ValidationResult> {
    console.log('🔍 Analyzing migration dependencies...');
    
    try {
      // Validate dependencies
      const validation = this.dependencyResolver.validateDependencies(this.migrations);
      
      if (!validation.isValid) {
        console.error('❌ Migration dependency validation failed:');
        validation.errors.forEach(error => console.error(`   • ${error}`));
        throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️  Migration dependency warnings:');
        validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
      }

      // Resolve dependencies and reorder migrations
      const graph = this.dependencyResolver.analyzeMigrations(this.migrations);
      this.migrations = this.dependencyResolver.resolveDependencies(graph);

      console.log('✅ Migration dependencies analyzed and resolved');
      console.log('📋 Execution order:');
      this.migrations.forEach((m, index) => {
        console.log(`   ${index + 1}. ${m.filename}`);
        if (m.dependencies.length > 0) {
          console.log(`      Dependencies: ${m.dependencies.join(', ')}`);
        }
      });

      return validation;
      
    } catch (error) {
      console.error('❌ Failed to analyze dependencies:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<Map<string, string>> {
    try {
      // Check if status column exists first
      const statusColumnExists = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'schema_migrations' 
          AND column_name = 'status'
        )
      `;

      let executed;
      if (statusColumnExists[0].exists) {
        executed = await this.sql`
          SELECT filename, checksum FROM schema_migrations 
          WHERE status = 'completed'
          ORDER BY executed_at
        `;
      } else {
        // Fallback for older schema without status column
        executed = await this.sql`
          SELECT filename, checksum FROM schema_migrations 
          ORDER BY executed_at
        `;
      }
      
      return new Map(executed.map((row: any) => [row.filename, row.checksum]));
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error instanceof Error ? error.message : String(error));
      return new Map();
    }
  }

  async executeMigration(migration: MigrationFile): Promise<void> {
    const startTime = Date.now();
    
    console.log(`🚀 Executing migration: ${migration.filename}`);
    
    try {
      // Check if status column exists for enhanced tracking
      const statusColumnExists = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'schema_migrations' 
          AND column_name = 'status'
        )
      `;

      if (statusColumnExists[0].exists) {
        // Record migration start with enhanced tracking
        await this.sql`
          INSERT INTO schema_migrations (filename, checksum, status, recovery_attempts)
          VALUES (${migration.filename}, ${migration.checksum}, 'running', 0)
          ON CONFLICT (filename) DO UPDATE SET
            status = 'running',
            recovery_attempts = schema_migrations.recovery_attempts + 1
        `;
      }

      // Execute the migration in a transaction
      await this.sql.begin(async (sql: any) => {
        await sql.unsafe(migration.content);
      });

      // Record successful completion
      const executionTime = Date.now() - startTime;
      
      if (statusColumnExists[0].exists) {
        await this.sql`
          UPDATE schema_migrations 
          SET status = 'completed', 
              execution_time_ms = ${executionTime},
              executed_at = NOW(),
              error_message = NULL
          WHERE filename = ${migration.filename}
        `;
      } else {
        // Fallback for basic schema
        await this.sql`
          INSERT INTO schema_migrations (filename, checksum, execution_time_ms)
          VALUES (${migration.filename}, ${migration.checksum}, ${executionTime})
          ON CONFLICT (filename) DO UPDATE SET
            checksum = EXCLUDED.checksum,
            executed_at = NOW(),
            execution_time_ms = EXCLUDED.execution_time_ms
        `;
      }

      console.log(`✅ Migration completed in ${executionTime}ms: ${migration.filename}`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if status column exists for error recording
      const statusColumnExists = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'schema_migrations' 
          AND column_name = 'status'
        )
      `;

      if (statusColumnExists[0].exists) {
        // Record failure with enhanced tracking
        await this.sql`
          UPDATE schema_migrations 
          SET status = 'failed', 
              execution_time_ms = ${executionTime},
              error_message = ${errorMessage}
          WHERE filename = ${migration.filename}
        `;
      }

      console.error(`❌ Migration failed: ${migration.filename}`);
      console.error(`   Error: ${errorMessage}`);
      throw error;
    }
  }

  async runMigrations(): Promise<ExecutionResult> {
    console.log('🔄 Starting migration process...');
    
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
        
        // For now, stop on first error (could be made configurable)
        break;
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
      console.log(`   • Total execution time: ${executionTime}ms`);
      console.log('');
      console.log('✅ Database schema is now fully synchronized and ready!');
      console.log('═══════════════════════════════════════════════════════════════');
    }

    return {
      success: errors.length === 0,
      migrationsRun,
      migrationsSkipped,
      totalMigrations: this.migrations.length,
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
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        await this.connect();
        await this.acquireAdvisoryLock();
        await this.createMigrationsTable();
        await this.loadMigrations();
        await this.analyzeDependencies();
        const result = await this.runMigrations();
        await this.close();
        return result;
        
      } catch (error) {
        retries++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Migration attempt ${retries}/${this.config.maxRetries} failed: ${errorMessage}`);
        
        // Always try to release lock on failure
        await this.releaseAdvisoryLock();
        
        if (retries < this.config.maxRetries) {
          console.log(`⏳ Retrying in ${this.config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        } else {
          console.error('💥 All migration attempts failed!');
          throw error;
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Migration failed after all retries');
  }

  /**
   * Validate migration prerequisites without executing
   */
  async validateMigrationPrerequisites(migration: MigrationFile): Promise<ValidationResult> {
    return this.dependencyResolver.validateDependencies([migration]);
  }

  /**
   * Get execution status for monitoring
   */
  async getExecutionStatus(): Promise<any> {
    if (!this.sql) {
      return { status: 'disconnected' };
    }

    try {
      const migrations = await this.sql`
        SELECT filename, status, executed_at, execution_time_ms, error_message, recovery_attempts
        FROM schema_migrations 
        ORDER BY executed_at DESC
      `;

      return {
        status: 'connected',
        totalMigrations: migrations.length,
        completedMigrations: migrations.filter((m: any) => m.status === 'completed').length,
        failedMigrations: migrations.filter((m: any) => m.status === 'failed').length,
        runningMigrations: migrations.filter((m: any) => m.status === 'running').length,
        migrations
      };
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

export default EnhancedMigrationRunner;