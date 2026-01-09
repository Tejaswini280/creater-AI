#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * 
 * This script verifies that all required tables and columns exist
 * and that the database schema matches the migration requirements.
 */

const postgres = require('postgres');

// Configuration
const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

class SchemaVerifier {
  constructor() {
    this.sql = null;
    this.errors = [];
    this.warnings = [];
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

  async verifyTables() {
    console.log('📋 Verifying required tables exist...');
    
    const requiredTables = [
      'users',
      'content',
      'content_metrics',
      'ai_generation_tasks',
      'projects',
      'ai_projects',
      'ai_generated_content',
      'ai_content_calendar',
      'ai_engagement_patterns',
      'project_content_management',
      'content_action_history',
      'structured_outputs',
      'generated_code',
      'post_schedules',
      'templates',
      'hashtag_suggestions'
    ];

    try {
      const existingTables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const tableNames = existingTables.map(row => row.table_name);
      
      for (const table of requiredTables) {
        if (tableNames.includes(table)) {
          console.log(`  ✅ Table '${table}' exists`);
        } else {
          this.errors.push(`Missing table: ${table}`);
          console.log(`  ❌ Table '${table}' is missing`);
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to verify tables: ${error.message}`);
    }
  }

  async verifyContentTableColumns() {
    console.log('📋 Verifying content table columns...');
    
    const requiredColumns = [
      'id',
      'user_id',
      'project_id',
      'title',
      'description',
      'script',
      'platform',
      'content_type',
      'status',
      'scheduled_at',
      'published_at',
      'day_number',      // ✅ This was missing and causing errors
      'is_paused',       // ✅ This was missing and causing errors
      'is_stopped',      // ✅ This was missing and causing errors
      'can_publish',
      'publish_order',
      'content_version',
      'last_regenerated_at',
      'created_at',
      'updated_at'
    ];

    try {
      const columns = await this.sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(col => col.column_name);
      
      for (const column of requiredColumns) {
        if (columnNames.includes(column)) {
          console.log(`  ✅ Column 'content.${column}' exists`);
        } else {
          this.errors.push(`Missing column: content.${column}`);
          console.log(`  ❌ Column 'content.${column}' is missing`);
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to verify content table columns: ${error.message}`);
    }
  }

  async verifyPostSchedulesColumns() {
    console.log('📋 Verifying post_schedules table columns...');
    
    const requiredColumns = [
      'id',
      'social_post_id',
      'platform',
      'scheduled_at',
      'recurrence',      // ✅ This was missing and causing errors
      'timezone',        // ✅ This was missing and causing errors
      'series_end_date', // ✅ This was missing and causing errors
      'status',
      'created_at',
      'updated_at'
    ];

    try {
      const columns = await this.sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'post_schedules' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      const columnNames = columns.map(col => col.column_name);
      
      for (const column of requiredColumns) {
        if (columnNames.includes(column)) {
          console.log(`  ✅ Column 'post_schedules.${column}' exists`);
        } else {
          this.errors.push(`Missing column: post_schedules.${column}`);
          console.log(`  ❌ Column 'post_schedules.${column}' is missing`);
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to verify post_schedules table columns: ${error.message}`);
    }
  }

  async verifyAITables() {
    console.log('📋 Verifying AI project management tables...');
    
    const aiTables = [
      'ai_projects',
      'ai_generated_content',
      'ai_content_calendar',
      'ai_engagement_patterns',
      'project_content_management',
      'content_action_history'
    ];

    try {
      for (const table of aiTables) {
        const result = await this.sql`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_name = ${table} 
          AND table_schema = 'public'
        `;
        
        if (result[0].count > 0) {
          console.log(`  ✅ AI table '${table}' exists`);
          
          // Check if table has data
          const dataCount = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`    📊 Records: ${dataCount[0].count}`);
        } else {
          this.errors.push(`Missing AI table: ${table}`);
          console.log(`  ❌ AI table '${table}' is missing`);
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to verify AI tables: ${error.message}`);
    }
  }

  async verifyIndexes() {
    console.log('📋 Verifying database indexes...');
    
    try {
      const indexes = await this.sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `;
      
      console.log(`  📊 Found ${indexes.length} custom indexes`);
      
      // Check for critical performance indexes
      const criticalIndexes = [
        'idx_content_user_id',
        'idx_content_project_id',
        'idx_content_status',
        'idx_ai_projects_user_id',
        'idx_ai_generated_content_ai_project_id'
      ];
      
      const indexNames = indexes.map(idx => idx.indexname);
      
      for (const index of criticalIndexes) {
        if (indexNames.includes(index)) {
          console.log(`  ✅ Critical index '${index}' exists`);
        } else {
          this.warnings.push(`Missing performance index: ${index}`);
          console.log(`  ⚠️ Performance index '${index}' is missing`);
        }
      }
      
    } catch (error) {
      this.warnings.push(`Failed to verify indexes: ${error.message}`);
    }
  }

  async verifyMigrationHistory() {
    console.log('📋 Verifying migration history...');
    
    try {
      const migrationTable = await this.sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_name = 'schema_migrations' 
        AND table_schema = 'public'
      `;
      
      if (migrationTable[0].count > 0) {
        console.log('  ✅ Migration tracking table exists');
        
        const migrations = await this.sql`
          SELECT filename, executed_at, execution_time_ms
          FROM schema_migrations 
          ORDER BY executed_at DESC
        `;
        
        console.log(`  📊 Migration history (${migrations.length} migrations):`);
        migrations.forEach(migration => {
          console.log(`    📄 ${migration.filename} - ${migration.executed_at} (${migration.execution_time_ms}ms)`);
        });
      } else {
        this.warnings.push('Migration tracking table does not exist');
        console.log('  ⚠️ Migration tracking table does not exist');
      }
      
    } catch (error) {
      this.warnings.push(`Failed to verify migration history: ${error.message}`);
    }
  }

  async verifyEngagementPatterns() {
    console.log('📋 Verifying AI engagement patterns data...');
    
    try {
      const patterns = await this.sql`
        SELECT platform, category, COUNT(*) as count
        FROM ai_engagement_patterns 
        GROUP BY platform, category
        ORDER BY platform, category
      `;
      
      if (patterns.length > 0) {
        console.log(`  ✅ Found ${patterns.length} engagement pattern categories`);
        patterns.forEach(pattern => {
          console.log(`    📊 ${pattern.platform}/${pattern.category}: ${pattern.count} patterns`);
        });
      } else {
        this.warnings.push('No engagement patterns data found');
        console.log('  ⚠️ No engagement patterns data found');
      }
      
    } catch (error) {
      this.warnings.push(`Failed to verify engagement patterns: ${error.message}`);
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
      await this.verifyTables();
      await this.verifyContentTableColumns();
      await this.verifyPostSchedulesColumns();
      await this.verifyAITables();
      await this.verifyIndexes();
      await this.verifyMigrationHistory();
      await this.verifyEngagementPatterns();
      await this.close();
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      
      if (this.errors.length === 0) {
        console.log('✅ DATABASE SCHEMA VERIFICATION PASSED');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎉 All required tables and columns exist');
        console.log('🎉 Database schema is fully synchronized');
        
        if (this.warnings.length > 0) {
          console.log('');
          console.log('⚠️ Warnings:');
          this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
      } else {
        console.log('❌ DATABASE SCHEMA VERIFICATION FAILED');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('💥 Critical issues found:');
        this.errors.forEach(error => console.log(`   • ${error}`));
        
        if (this.warnings.length > 0) {
          console.log('');
          console.log('⚠️ Additional warnings:');
          this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        console.log('');
        console.log('🔧 To fix these issues, run:');
        console.log('   node scripts/run-migrations.js');
        
        throw new Error('Database schema verification failed');
      }
      
      console.log('═══════════════════════════════════════════════════════════════');
      
    } catch (error) {
      console.error('💥 Schema verification failed:', error.message);
      throw error;
    }
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new SchemaVerifier();
  
  verifier.run()
    .then(() => {
      console.log('🎯 Database schema verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database schema verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = SchemaVerifier;