#!/usr/bin/env node

/**
 * Fixed Migration Runner
 * Simple, reliable migration execution without complex dependency resolution
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

class SimpleMigrationRunner {
  constructor() {
    this.sql = null;
    this.migrationsDir = path.join(process.cwd(), 'migrations');
  }

  async connect() {
    console.log('🔌 Connecting to database...');
    
    try {
      this.sql = postgres(config.connectionString, {
        ssl: config.ssl,
        max: config.max,
        idle_timeout: config.idle_timeout,
        connect_timeout: config.connect_timeout
      });

      await this.sql`SELECT 1`;
      console.log('✅ Database connection successful');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async createMigrationsTable() {
    console.log('📋 Creating migrations table...');
    
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR NOT NULL,
          execution_time_ms INTEGER
        )
      `;
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error.message);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const executed = await this.sql`
        SELECT filename, checksum FROM schema_migrations 
        ORDER BY executed_at
      `;
      return new Map(executed.map(row => [row.filename, row.checksum]));
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error.message);
      return new Map();
    }
  }

  async executeMigration(filename, content, checksum) {
    const startTime = Date.now();
    
    console.log(`🚀 Executing migration: ${filename}`);
    
    try {
      // Execute the migration in a transaction
      await this.sql.begin(async (sql) => {
        await sql.unsafe(content);
      });

      // Record successful completion
      const executionTime = Date.now() - startTime;
      
      await this.sql`
        INSERT INTO schema_migrations (filename, checksum, execution_time_ms)
        VALUES (${filename}, ${checksum}, ${executionTime})
        ON CONFLICT (filename) DO UPDATE SET
          checksum = EXCLUDED.checksum,
          executed_at = NOW(),
          execution_time_ms = EXCLUDED.execution_time_ms
      `;

      console.log(`✅ Migration completed in ${executionTime}ms: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async runMigrations() {
    console.log('🔄 Starting migration process...');
    
    try {
      // Get list of migration files
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`📁 Found ${files.length} migration files`);

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      
      let migrationsRun = 0;
      let migrationsSkipped = 0;

      // Process each migration in order
      for (const filename of files) {
        const filepath = path.join(this.migrationsDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filepath)) {
          console.log(`⚠️  Migration file not found: ${filename}`);
          continue;
        }

        const content = fs.readFileSync(filepath, 'utf8');
        const checksum = createHash('md5').update(content).digest('hex');
        
        const executedChecksum = executedMigrations.get(filename);
        
        if (executedChecksum) {
          if (executedChecksum === checksum) {
            console.log(`⏭️  Skipping migration: ${filename}`);
            migrationsSkipped++;
            continue;
          } else {
            console.log(`🔄 Re-executing (checksum changed): ${filename}`);
          }
        } else {
          console.log(`✅ Including safe migration: ${filename}`);
        }

        await this.executeMigration(filename, content, checksum);
        migrationsRun++;
      }

      console.log('✅ All migrations completed successfully');
      console.log(`📊 Summary: ${migrationsRun} executed, ${migrationsSkipped} skipped`);
      
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.sql) {
      await this.sql.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.createMigrationsTable();
      await this.runMigrations();
      await this.close();
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ DATABASE MIGRATIONS COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════════');
      
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SimpleMigrationRunner();
  
  runner.run()
    .then(() => {
      console.log('🎯 Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default SimpleMigrationRunner;
