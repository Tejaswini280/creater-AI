#!/usr/bin/env node

/**
 * Production-Grade Database Migration Runner
 * 
 * This script runs database migrations in the correct order and ensures
 * idempotent execution for both Docker and Railway deployments.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Use DATABASE_URL if available, otherwise build from components
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  
  // Migration settings
  migrationsDir: path.join(__dirname, '..', 'migrations'),
  maxRetries: 3,
  retryDelay: 2000,
  
  // Connection settings for different environments
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1, // Single connection for migrations
  idle_timeout: 20,
  connect_timeout: 10
};

class MigrationRunner {
  constructor() {
    this.sql = null;
    this.migrations = [];
    this.lockAcquired = false;
  }

  async connect() {
    console.log('🔌 Connecting to database...');
    
    try {
      this.sql = postgres(config.connectionString, {
        ssl: config.ssl,
        max: config.max,
        idle_timeout: config.idle_timeout,
        connect_timeout: config.connect_timeout,
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
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async acquireAdvisoryLock() {
    console.log('🔒 Acquiring PostgreSQL advisory lock for migrations...');
    
    try {
      // Use a unique lock ID for migrations (42424242)
      const result = await this.sql`SELECT pg_advisory_lock(42424242)`;
      this.lockAcquired = true;
      console.log('✅ Advisory lock acquired - this process is the sole migrator');
      return true;
    } catch (error) {
      console.error('❌ Failed to acquire advisory lock:', error.message);
      throw error;
    }
  }

  async releaseAdvisoryLock() {
    if (this.lockAcquired) {
      console.log('🔓 Releasing PostgreSQL advisory lock...');
      try {
        await this.sql`SELECT pg_advisory_unlock(42424242)`;
        this.lockAcquired = false;
        console.log('✅ Advisory lock released');
      } catch (error) {
        console.error('❌ Failed to release advisory lock:', error.message);
      }
    }
  }

  async createMigrationsTable() {
    console.log('📋 Creating migrations tracking table...');
    
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR,
          execution_time_ms INTEGER
        )
      `;
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error.message);
      throw error;
    }
  }

  async loadMigrations() {
    console.log('📂 Loading migration files...');
    
    try {
      const files = fs.readdirSync(config.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure correct order

      this.migrations = files.map(filename => {
        const filepath = path.join(config.migrationsDir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const checksum = createHash('md5').update(content).digest('hex');
        
        return {
          filename,
          filepath,
          content,
          checksum
        };
      });

      console.log(`✅ Loaded ${this.migrations.length} migration files`);
      this.migrations.forEach(m => console.log(`   📄 ${m.filename}`));
      
    } catch (error) {
      console.error('❌ Failed to load migrations:', error.message);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const executed = await this.sql`
        SELECT filename, checksum FROM schema_migrations ORDER BY executed_at
      `;
      return new Map(executed.map(row => [row.filename, row.checksum]));
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error.message);
      return new Map();
    }
  }

  async executeMigration(migration) {
    const startTime = Date.now();
    
    console.log(`🚀 Executing migration: ${migration.filename}`);
    
    try {
      // Execute the migration in a transaction
      await this.sql.begin(async sql => {
        // Run the migration
        await sql.unsafe(migration.content);
        
        // Record the execution
        await sql`
          INSERT INTO schema_migrations (filename, checksum, execution_time_ms)
          VALUES (${migration.filename}, ${migration.checksum}, ${Date.now() - startTime})
          ON CONFLICT (filename) DO UPDATE SET
            checksum = EXCLUDED.checksum,
            executed_at = NOW(),
            execution_time_ms = EXCLUDED.execution_time_ms
        `;
      });

      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration completed in ${executionTime}ms: ${migration.filename}`);
      
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.filename}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async runMigrations() {
    console.log('🔄 Starting migration process...');
    
    const executedMigrations = await this.getExecutedMigrations();
    let migrationsRun = 0;
    let migrationsSkipped = 0;

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

      await this.executeMigration(migration);
      migrationsRun++;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 MIGRATION PROCESS COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Migrations executed: ${migrationsRun}`);
    console.log(`   • Migrations skipped: ${migrationsSkipped}`);
    console.log(`   • Total migrations: ${this.migrations.length}`);
    console.log('');
    console.log('✅ Database schema is now fully synchronized and ready!');
    console.log('═══════════════════════════════════════════════════════════════');
  }

  async close() {
    if (this.sql) {
      await this.releaseAdvisoryLock();
      await this.sql.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run() {
    let retries = 0;
    
    while (retries < config.maxRetries) {
      try {
        await this.connect();
        await this.acquireAdvisoryLock();
        await this.createMigrationsTable();
        await this.loadMigrations();
        await this.runMigrations();
        await this.close();
        return; // Success!
        
      } catch (error) {
        retries++;
        console.error(`❌ Migration attempt ${retries}/${config.maxRetries} failed:`, error.message);
        
        // Always try to release lock on failure
        await this.releaseAdvisoryLock();
        
        if (retries < config.maxRetries) {
          console.log(`⏳ Retrying in ${config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        } else {
          console.error('💥 All migration attempts failed!');
          throw error;
        }
      }
    }
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MigrationRunner();
  
  runner.run()
    .then(() => {
      console.log('🎯 Migration runner completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration runner failed:', error);
      process.exit(1);
    });
}

export default MigrationRunner;