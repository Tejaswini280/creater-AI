#!/usr/bin/env node

/**
 * Production-Grade Database Migration Runner with Dependency Resolution
 * 
 * This script runs database migrations in the correct order using dependency analysis
 * to prevent circular dependency issues and ensures idempotent execution.
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

/**
 * Migration Dependency Resolver (JavaScript version)
 */
class MigrationDependencyResolver {
  constructor() {
    this.sqlParser = new SQLParser();
  }

  analyzeMigrations(migrationFiles) {
    const graph = {
      nodes: new Map(),
      edges: new Map()
    };

    // First pass: analyze each migration file
    for (const migration of migrationFiles) {
      const analysis = this.sqlParser.analyzeMigration(migration.content);
      
      migration.creates = analysis.creates;
      migration.references = analysis.references;
      migration.dependencies = this.calculateDependencies(migration, migrationFiles);
      
      graph.nodes.set(migration.filename, migration);
      graph.edges.set(migration.filename, new Set(migration.dependencies));
    }

    return graph;
  }

  resolveDependencies(graph) {
    const resolved = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (filename) => {
      if (visited.has(filename)) return;
      if (visiting.has(filename)) {
        throw new Error(`Circular dependency detected involving: ${filename}`);
      }

      visiting.add(filename);
      
      const dependencies = graph.edges.get(filename) || new Set();
      for (const dep of Array.from(dependencies)) {
        visit(dep);
      }
      
      visiting.delete(filename);
      visited.add(filename);
      
      const migration = graph.nodes.get(filename);
      if (migration) {
        migration.order = resolved.length;
        resolved.push(migration);
      }
    };

    // Visit all nodes
    for (const filename of Array.from(graph.nodes.keys())) {
      visit(filename);
    }

    return resolved;
  }

  calculateDependencies(migration, allMigrations) {
    const dependencies = [];
    
    // Find migrations that create tables/columns this migration references
    for (const other of allMigrations) {
      if (other.filename === migration.filename) continue;
      if (other.filename > migration.filename) continue; // Only depend on earlier migrations
      
      const otherAnalysis = this.sqlParser.analyzeMigration(other.content);
      
      // Check if this migration references something the other creates
      for (const reference of migration.references) {
        if (otherAnalysis.creates.includes(reference)) {
          dependencies.push(other.filename);
          break;
        }
      }
    }

    return dependencies;
  }
}

/**
 * SQL Parser for extracting table/column information from migration files
 */
class SQLParser {
  analyzeMigration(content) {
    const creates = [];
    const references = [];

    // Normalize content
    const normalizedContent = content
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .toLowerCase();

    // Extract table creations
    const tableCreations = this.extractTableCreations(normalizedContent);
    creates.push(...tableCreations.tables);
    creates.push(...tableCreations.columns);

    // Extract index creations (these reference columns)
    const indexReferences = this.extractIndexReferences(normalizedContent);
    references.push(...indexReferences);

    // Extract foreign key references
    const fkReferences = this.extractForeignKeyReferences(normalizedContent);
    references.push(...fkReferences);

    return { creates, references };
  }

  extractTableCreations(content) {
    const tables = [];
    const columns = [];

    // Match CREATE TABLE statements
    const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)\s*\(/gi;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1];
      tables.push(tableName);

      // Extract columns for this table
      const tableStart = match.index + match[0].length;
      const tableEnd = this.findMatchingParen(content, tableStart - 1);
      const tableDefinition = content.substring(tableStart, tableEnd);

      const columnMatches = tableDefinition.match(/(\w+)\s+(?:varchar|text|integer|serial|boolean|timestamp|numeric|decimal)/gi);
      if (columnMatches) {
        for (const columnMatch of columnMatches) {
          const columnName = columnMatch.split(/\s+/)[0];
          columns.push(`${tableName}.${columnName}`);
        }
      }
    }

    return { tables, columns };
  }

  extractIndexReferences(content) {
    const references = [];

    // Match CREATE INDEX statements
    const indexRegex = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[\w_]+\s+on\s+(\w+)\s*\(\s*([^)]+)\s*\)/gi;
    let match;

    while ((match = indexRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnList = match[2];

      // Parse column list
      const columns = columnList.split(',').map(col => {
        const cleanCol = col.trim().split(/\s+/)[0]; // Remove ASC/DESC, etc.
        return `${tableName}.${cleanCol}`;
      });

      references.push(...columns);
    }

    return references;
  }

  extractForeignKeyReferences(content) {
    const references = [];

    // Match FOREIGN KEY constraints
    const fkRegex = /foreign\s+key\s*\(\s*(\w+)\s*\)\s+references\s+(\w+)\s*\(\s*(\w+)\s*\)/gi;
    let match;

    while ((match = fkRegex.exec(content)) !== null) {
      const referencedTable = match[2];
      const referencedColumn = match[3];
      references.push(`${referencedTable}.${referencedColumn}`);
    }

    return references;
  }

  findMatchingParen(content, startIndex) {
    let depth = 1;
    let index = startIndex + 1;

    while (index < content.length && depth > 0) {
      if (content[index] === '(') depth++;
      else if (content[index] === ')') depth--;
      index++;
    }

    return index - 1;
  }
}

/**
 * Enhanced Migration Runner (JavaScript version)
 */
class EnhancedMigrationRunner {
  constructor() {
    this.sql = null;
    this.migrations = [];
    this.lockAcquired = false;
    this.dependencyResolver = new MigrationDependencyResolver();
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
      await this.sql`SELECT pg_advisory_lock(42424242)`;
      this.lockAcquired = true;
      console.log('✅ Advisory lock acquired - this process is the sole migrator');
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
      console.error('❌ Failed to create migrations table:', error.message);
      throw error;
    }
  }

  async loadMigrations() {
    console.log('📂 Loading migration files...');
    
    try {
      const files = fs.readdirSync(config.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Initial sort by filename

      this.migrations = files.map(filename => {
        const filepath = path.join(config.migrationsDir, filename);
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
      console.error('❌ Failed to load migrations:', error.message);
      throw error;
    }
  }

  async analyzeDependencies() {
    console.log('🔍 Analyzing migration dependencies...');
    
    try {
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
      
    } catch (error) {
      console.error('❌ Failed to analyze dependencies:', error.message);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const executed = await this.sql`
        SELECT filename, checksum FROM schema_migrations 
        WHERE status = 'completed'
        ORDER BY executed_at
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
      // Record migration start
      await this.sql`
        INSERT INTO schema_migrations (filename, checksum, status, recovery_attempts)
        VALUES (${migration.filename}, ${migration.checksum}, 'running', 0)
        ON CONFLICT (filename) DO UPDATE SET
          status = 'running',
          recovery_attempts = schema_migrations.recovery_attempts + 1
      `;

      // Execute the migration in a transaction
      await this.sql.begin(async (sql) => {
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

      console.log(`✅ Migration completed in ${executionTime}ms: ${migration.filename}`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message;
      
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

  async runMigrations() {
    console.log('🔄 Starting migration process...');
    
    const startTime = Date.now();
    const executedMigrations = await this.getExecutedMigrations();
    let migrationsRun = 0;
    let migrationsSkipped = 0;
    const errors = [];

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
        const errorMessage = error.message;
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
        await this.analyzeDependencies();
        const result = await this.runMigrations();
        await this.close();
        return result;
        
      } catch (error) {
        retries++;
        const errorMessage = error.message;
        console.error(`❌ Migration attempt ${retries}/${config.maxRetries} failed: ${errorMessage}`);
        
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

    // This should never be reached, but JavaScript requires it
    throw new Error('Migration failed after all retries');
  }
}

// Run migrations - always execute when this script is run
console.log('🚀 Starting Enhanced Migration Runner...');

const runner = new EnhancedMigrationRunner();

runner.run()
  .then((result) => {
    if (result.success) {
      console.log('🎯 Enhanced migration runner completed successfully');
      process.exit(0);
    } else {
      console.error('💥 Enhanced migration runner failed:', result.errors.join(', '));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Enhanced migration runner failed:', error);
    process.exit(1);
  });

export default EnhancedMigrationRunner;