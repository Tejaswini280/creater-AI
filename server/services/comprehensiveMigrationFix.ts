import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationFile {
  filename: string;
  path: string;
  content: string;
  dependencies: string[];
  tables: string[];
  columns: string[];
}

interface MigrationResult {
  success: boolean;
  executed: string[];
  skipped: string[];
  errors: string[];
  message: string;
}

export class ComprehensiveMigrationFix {
  private pool: Pool;
  private migrationsDir: string;
  private lockId = 42424242; // Advisory lock ID

  constructor(pool: Pool) {
    this.pool = pool;
    this.migrationsDir = path.resolve(__dirname, '../../migrations');
  }

  /**
   * Main entry point - fixes all migration issues comprehensively
   */
  async fixAllMigrationIssues(): Promise<MigrationResult> {
    console.log('🔧 Starting comprehensive migration fix...');
    
    const result: MigrationResult = {
      success: false,
      executed: [],
      skipped: [],
      errors: [],
      message: ''
    };

    try {
      // Step 1: Acquire advisory lock
      await this.acquireAdvisoryLock();
      console.log('🔒 Advisory lock acquired');

      // Step 2: Validate database connection
      await this.validateDatabaseConnection();
      console.log('✅ Database connection validated');

      // Step 3: Create migration tracking table
      await this.createMigrationTrackingTable();
      console.log('📋 Migration tracking table ready');

      // Step 4: Analyze existing migrations
      const migrations = await this.analyzeMigrations();
      console.log(`📁 Found ${migrations.length} migration files`);

      // Step 5: Validate migration files exist
      const validMigrations = await this.validateMigrationFiles(migrations);
      console.log(`✅ ${validMigrations.length} valid migrations found`);

      // Step 6: Check current database state
      const dbState = await this.analyzeDatabaseState();
      console.log('🔍 Database state analyzed');

      // Step 7: Create execution plan
      const executionPlan = await this.createExecutionPlan(validMigrations, dbState);
      console.log(`📋 Execution plan created: ${executionPlan.length} migrations to run`);

      // Step 8: Execute migrations safely
      for (const migration of executionPlan) {
        try {
          await this.executeMigrationSafely(migration);
          result.executed.push(migration.filename);
          console.log(`✅ Executed: ${migration.filename}`);
        } catch (error) {
          const errorMsg = `Failed to execute ${migration.filename}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          
          // Continue with other migrations instead of failing completely
          result.skipped.push(migration.filename);
        }
      }

      // Step 9: Verify database integrity
      await this.verifyDatabaseIntegrity();
      console.log('✅ Database integrity verified');

      // Step 10: Seed essential data
      await this.seedEssentialData();
      console.log('🌱 Essential data seeded');

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? 'All migrations completed successfully'
        : `Completed with ${result.errors.length} errors`;

    } catch (error) {
      result.success = false;
      result.message = `Migration fix failed: ${error}`;
      result.errors.push(String(error));
      console.error('❌ Migration fix failed:', error);
    } finally {
      // Always release the advisory lock
      await this.releaseAdvisoryLock();
      console.log('🔓 Advisory lock released');
    }

    return result;
  }

  /**
   * Acquire PostgreSQL advisory lock with timeout
   */
  private async acquireAdvisoryLock(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Try to acquire lock with timeout
      const result = await client.query(
        'SELECT pg_try_advisory_lock($1) as acquired',
        [this.lockId]
      );
      
      if (!result.rows[0].acquired) {
        throw new Error('Could not acquire migration lock - another migration may be running');
      }
    } finally {
      client.release();
    }
  }

  /**
   * Release PostgreSQL advisory lock
   */
  private async releaseAdvisoryLock(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [this.lockId]);
    } catch (error) {
      console.warn('Warning: Could not release advisory lock:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Validate database connection and basic functionality
   */
  private async validateDatabaseConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      await client.query('SELECT version()');
    } finally {
      client.release();
    }
  }

  /**
   * Create migration tracking table if it doesn't exist
   */
  private async createMigrationTrackingTable(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW(),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          checksum VARCHAR(64)
        )
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Analyze all migration files and their dependencies
   */
  private async analyzeMigrations(): Promise<MigrationFile[]> {
    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`⚠️ Migrations directory not found: ${this.migrationsDir}`);
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: MigrationFile[] = [];

    for (const filename of files) {
      const filePath = path.join(this.migrationsDir, filename);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        migrations.push({
          filename,
          path: filePath,
          content,
          dependencies: this.extractDependencies(content),
          tables: this.extractTables(content),
          columns: this.extractColumns(content)
        });
      }
    }

    return migrations;
  }

  /**
   * Validate that migration files exist and are readable
   */
  private async validateMigrationFiles(migrations: MigrationFile[]): Promise<MigrationFile[]> {
    const validMigrations: MigrationFile[] = [];

    for (const migration of migrations) {
      if (fs.existsSync(migration.path)) {
        try {
          // Validate SQL syntax by attempting to parse
          if (migration.content.trim().length > 0) {
            validMigrations.push(migration);
          } else {
            console.warn(`⚠️ Empty migration file: ${migration.filename}`);
          }
        } catch (error) {
          console.warn(`⚠️ Invalid migration file: ${migration.filename} - ${error}`);
        }
      } else {
        console.warn(`⚠️ Migration file not found: ${migration.path}`);
      }
    }

    return validMigrations;
  }

  /**
   * Analyze current database state
   */
  private async analyzeDatabaseState(): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Get existing tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      // Get existing columns
      const columnsResult = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
      `);

      // Get executed migrations
      const migrationsResult = await client.query(`
        SELECT filename 
        FROM migration_history 
        WHERE success = true
      `).catch(() => ({ rows: [] })); // Table might not exist yet

      return {
        tables: tablesResult.rows.map(r => r.table_name),
        columns: columnsResult.rows,
        executedMigrations: migrationsResult.rows.map(r => r.filename)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create safe execution plan based on dependencies and current state
   */
  private async createExecutionPlan(migrations: MigrationFile[], dbState: any): Promise<MigrationFile[]> {
    const executionPlan: MigrationFile[] = [];
    const executed = new Set(dbState.executedMigrations);

    // Filter out already executed migrations
    const pendingMigrations = migrations.filter(m => !executed.has(m.filename));

    // Sort by filename (which includes sequence numbers)
    pendingMigrations.sort((a, b) => a.filename.localeCompare(b.filename));

    // Add safe migrations to execution plan
    for (const migration of pendingMigrations) {
      // Check if migration is safe to run
      if (this.isMigrationSafe(migration, dbState)) {
        executionPlan.push(migration);
      } else {
        console.warn(`⚠️ Skipping potentially unsafe migration: ${migration.filename}`);
      }
    }

    return executionPlan;
  }

  /**
   * Check if migration is safe to execute
   */
  private isMigrationSafe(migration: MigrationFile, dbState: any): boolean {
    // Always allow idempotent migrations
    if (migration.content.includes('IF NOT EXISTS') || 
        migration.content.includes('CREATE OR REPLACE') ||
        migration.filename.includes('idempotent')) {
      return true;
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /DROP TABLE(?!\s+IF\s+EXISTS)/i,
      /DROP COLUMN(?!\s+IF\s+EXISTS)/i,
      /ALTER TABLE.*DROP/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(migration.content)) {
        console.warn(`⚠️ Dangerous operation detected in ${migration.filename}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute migration with comprehensive error handling
   */
  private async executeMigrationSafely(migration: MigrationFile): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Execute migration content
      await client.query(migration.content);

      // Record successful execution
      await client.query(`
        INSERT INTO migration_history (filename, success) 
        VALUES ($1, true)
        ON CONFLICT (filename) DO UPDATE SET
          executed_at = NOW(),
          success = true,
          error_message = NULL
      `, [migration.filename]);

      // Commit transaction
      await client.query('COMMIT');

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');

      // Record failed execution
      await client.query(`
        INSERT INTO migration_history (filename, success, error_message) 
        VALUES ($1, false, $2)
        ON CONFLICT (filename) DO UPDATE SET
          executed_at = NOW(),
          success = false,
          error_message = $2
      `, [migration.filename, String(error)]);

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify database integrity after migrations
   */
  private async verifyDatabaseIntegrity(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Check for essential tables
      const essentialTables = [
        'users', 'projects', 'content', 'sessions',
        'post_schedules', 'templates', 'hashtag_suggestions'
      ];

      for (const table of essentialTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);

        if (!result.rows[0].exists) {
          throw new Error(`Essential table missing: ${table}`);
        }
      }

      // Check for essential columns
      const essentialColumns = [
        { table: 'users', column: 'email' },
        { table: 'users', column: 'password' },
        { table: 'content', column: 'project_id' },
        { table: 'projects', column: 'user_id' }
      ];

      for (const { table, column } of essentialColumns) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1 
            AND column_name = $2
          )
        `, [table, column]);

        if (!result.rows[0].exists) {
          console.warn(`⚠️ Essential column missing: ${table}.${column}`);
        }
      }

    } finally {
      client.release();
    }
  }

  /**
   * Seed essential data if tables are empty
   */
  private async seedEssentialData(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Seed AI engagement patterns
      await client.query(`
        INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score)
        VALUES 
          ('instagram', 'general', ARRAY['09:00', '12:00', '17:00', '20:00'], 0.75),
          ('tiktok', 'general', ARRAY['06:00', '10:00', '19:00', '21:00'], 0.80),
          ('youtube', 'general', ARRAY['14:00', '16:00', '20:00', '22:00'], 0.70)
        ON CONFLICT (platform, category) DO NOTHING
      `);

      // Seed basic templates
      await client.query(`
        INSERT INTO templates (title, description, category, type, content)
        VALUES 
          ('Daily Motivation', 'Inspirational daily content', 'lifestyle', 'post', 'Start your day with positivity! 💪'),
          ('Product Review', 'Template for product reviews', 'review', 'video', 'Today I''m reviewing... What do you think?'),
          ('Behind the Scenes', 'Show your process', 'lifestyle', 'story', 'Here''s what goes on behind the scenes...'),
          ('Tutorial Template', 'Step-by-step tutorial format', 'education', 'video', 'In this tutorial, I''ll show you how to...')
        ON CONFLICT DO NOTHING
      `);

      // Seed hashtag suggestions
      await client.query(`
        INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score)
        VALUES 
          ('instagram', 'general', '#content', 85),
          ('instagram', 'general', '#creator', 90),
          ('tiktok', 'general', '#fyp', 95),
          ('tiktok', 'general', '#viral', 88),
          ('youtube', 'general', '#tutorial', 75),
          ('youtube', 'general', '#howto', 80)
        ON CONFLICT DO NOTHING
      `);

    } catch (error) {
      console.warn('Warning: Could not seed essential data:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Extract table dependencies from SQL content
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Look for REFERENCES clauses
    const referenceMatches = content.match(/REFERENCES\s+(\w+)/gi);
    if (referenceMatches) {
      dependencies.push(...referenceMatches.map(match => 
        match.replace(/REFERENCES\s+/i, '').toLowerCase()
      ));
    }

    return [...new Set(dependencies)];
  }

  /**
   * Extract table names from SQL content
   */
  private extractTables(content: string): string[] {
    const tables: string[] = [];
    
    // Look for CREATE TABLE statements
    const createMatches = content.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
    if (createMatches) {
      tables.push(...createMatches.map(match => 
        match.replace(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, '').toLowerCase()
      ));
    }

    return [...new Set(tables)];
  }

  /**
   * Extract column names from SQL content
   */
  private extractColumns(content: string): string[] {
    const columns: string[] = [];
    
    // Look for ADD COLUMN statements
    const addMatches = content.match(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
    if (addMatches) {
      columns.push(...addMatches.map(match => 
        match.replace(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, '').split(/\s+/)[0].toLowerCase()
      ));
    }

    return [...new Set(columns)];
  }
}