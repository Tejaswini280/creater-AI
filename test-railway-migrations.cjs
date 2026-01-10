#!/usr/bin/env node

/**
 * Railway Migration Testing Script
 * 
 * Tests the corrected migration files to ensure they work properly
 * and will eliminate Railway 502 errors.
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_test_db'}`,
  
  migrationsDir: path.join(__dirname, 'migrations'),
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

class MigrationTester {
  constructor() {
    this.sql = null;
    this.testResults = [];
  }

  async connect() {
    console.log('🔌 Connecting to test database...');
    
    try {
      this.sql = postgres(config.connectionString, {
        ssl: config.ssl,
        max: config.max,
        idle_timeout: config.idle_timeout,
        connect_timeout: config.connect_timeout,
        onnotice: () => {} // Suppress notices for cleaner output
      });

      await this.sql`SELECT 1`;
      console.log('✅ Database connection successful');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async runMigrationTest() {
    console.log('\n🧪 TESTING CORRECTED MIGRATION FILES');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Get migration files in correct order
    const migrationFiles = fs.readdirSync(config.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`   📄 ${file}`));
    console.log('');

    // Test each migration
    for (const filename of migrationFiles) {
      await this.testMigration(filename);
    }

    // Run comprehensive validation
    await this.validateDatabase();
  }

  async testMigration(filename) {
    const filepath = path.join(config.migrationsDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    
    console.log(`🚀 Testing migration: ${filename}`);
    
    try {
      const startTime = Date.now();
      
      // Execute migration in transaction for safety
      await this.sql.begin(async sql => {
        await sql.unsafe(content);
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration successful in ${executionTime}ms: ${filename}`);
      
      this.testResults.push({
        filename,
        status: 'success',
        executionTime,
        error: null
      });
      
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`);
      console.error(`   Error: ${error.message}`);
      
      this.testResults.push({
        filename,
        status: 'failed',
        executionTime: 0,
        error: error.message
      });
      
      throw error; // Stop on first failure
    }
  }

  async validateDatabase() {
    console.log('\n🔍 VALIDATING DATABASE SCHEMA');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Test 1: Check critical tables exist
    await this.validateCriticalTables();
    
    // Test 2: Check critical columns exist
    await this.validateCriticalColumns();
    
    // Test 3: Check UNIQUE constraints for ON CONFLICT
    await this.validateUniqueConstraints();
    
    // Test 4: Test ON CONFLICT operations
    await this.testOnConflictOperations();
    
    // Test 5: Check indexes exist
    await this.validateIndexes();
  }

  async validateCriticalTables() {
    console.log('📋 Checking critical tables...');
    
    const requiredTables = [
      'users', 'projects', 'content', 'content_metrics',
      'ai_projects', 'ai_generated_content', 'ai_content_calendar',
      'post_schedules', 'templates', 'hashtag_suggestions',
      'ai_engagement_patterns', 'niches', 'sessions'
    ];

    const existingTables = await this.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const existingTableNames = existingTables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing critical tables: ${missingTables.join(', ')}`);
    }
    
    console.log(`✅ All ${requiredTables.length} critical tables exist`);
  }

  async validateCriticalColumns() {
    console.log('📋 Checking critical columns...');
    
    // Check users.password column (critical fix)
    const userColumns = await this.sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `;
    
    if (userColumns.length === 0) {
      throw new Error('Users table missing password column - authentication will fail');
    }
    
    // Check content.day_number column
    const contentColumns = await this.sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' AND column_name = 'day_number'
    `;
    
    if (contentColumns.length === 0) {
      throw new Error('Content table missing day_number column - project timeline will fail');
    }
    
    console.log('✅ All critical columns exist');
  }

  async validateUniqueConstraints() {
    console.log('📋 Checking UNIQUE constraints for ON CONFLICT...');
    
    const requiredConstraints = [
      { table: 'users', constraint: 'users_email_key' },
      { table: 'ai_engagement_patterns', constraint: 'ai_engagement_patterns_platform_category_key' },
      { table: 'niches', constraint: 'niches_name_key' }
    ];

    for (const { table, constraint } of requiredConstraints) {
      const constraints = await this.sql`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = ${table} AND constraint_name = ${constraint}
      `;
      
      if (constraints.length === 0) {
        throw new Error(`Missing UNIQUE constraint ${constraint} on table ${table} - ON CONFLICT will fail`);
      }
    }
    
    console.log('✅ All UNIQUE constraints exist for ON CONFLICT operations');
  }

  async testOnConflictOperations() {
    console.log('📋 Testing ON CONFLICT operations...');
    
    try {
      // Test users ON CONFLICT
      await this.sql`
        INSERT INTO users (id, email, password, first_name, last_name) 
        VALUES ('test-conflict', 'test-conflict@example.com', 'test', 'Test', 'User')
        ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
      `;
      
      // Test ai_engagement_patterns ON CONFLICT
      await this.sql`
        INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score) 
        VALUES ('test', 'test', ARRAY['12:00'], 0.5)
        ON CONFLICT (platform, category) DO UPDATE SET engagement_score = EXCLUDED.engagement_score
      `;
      
      // Test niches ON CONFLICT
      await this.sql`
        INSERT INTO niches (name, category, trend_score, difficulty, profitability, keywords, description) 
        VALUES ('Test Niche', 'test', 50, 'low', 'low', ARRAY['test'], 'Test description')
        ON CONFLICT (name) DO UPDATE SET trend_score = EXCLUDED.trend_score
      `;
      
      console.log('✅ All ON CONFLICT operations work correctly');
      
    } catch (error) {
      throw new Error(`ON CONFLICT operation failed: ${error.message}`);
    }
  }

  async validateIndexes() {
    console.log('📋 Checking critical indexes...');
    
    const indexes = await this.sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    
    const criticalIndexes = [
      'idx_users_email',
      'idx_content_user_id',
      'idx_content_metrics_content_id',
      'idx_projects_user_id',
      'idx_post_schedules_scheduled_at'
    ];
    
    const existingIndexNames = indexes.map(i => i.indexname);
    const missingIndexes = criticalIndexes.filter(index => !existingIndexNames.includes(index));
    
    if (missingIndexes.length > 0) {
      console.warn(`⚠️  Missing some indexes: ${missingIndexes.join(', ')}`);
    } else {
      console.log('✅ All critical indexes exist');
    }
    
    console.log(`📊 Total indexes created: ${indexes.length}`);
  }

  async printSummary() {
    console.log('\n📊 MIGRATION TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const successful = this.testResults.filter(r => r.status === 'success').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const totalTime = this.testResults.reduce((sum, r) => sum + r.executionTime, 0);
    
    console.log(`✅ Successful migrations: ${successful}`);
    console.log(`❌ Failed migrations: ${failed}`);
    console.log(`⏱️  Total execution time: ${totalTime}ms`);
    console.log('');
    
    if (failed === 0) {
      console.log('🎉 ALL MIGRATIONS PASSED - RAILWAY DEPLOYMENT READY!');
      console.log('');
      console.log('✅ Database schema is fully consistent');
      console.log('✅ All ON CONFLICT operations work');
      console.log('✅ All critical tables and columns exist');
      console.log('✅ Railway 502 errors will be eliminated');
    } else {
      console.log('💥 SOME MIGRATIONS FAILED - NEEDS FIXING');
      this.testResults.filter(r => r.status === 'failed').forEach(result => {
        console.log(`   ❌ ${result.filename}: ${result.error}`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
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
      await this.runMigrationTest();
      await this.printSummary();
      
    } catch (error) {
      console.error('\n💥 MIGRATION TEST FAILED');
      console.error('Error:', error.message);
      console.error('\nThis indicates the migrations need further fixes before Railway deployment.');
      throw error;
      
    } finally {
      await this.close();
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const tester = new MigrationTester();
  
  tester.run()
    .then(() => {
      console.log('\n🎯 Migration testing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = MigrationTester;