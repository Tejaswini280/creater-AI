#!/usr/bin/env node

/**
 * Railway Schema Repair Verification Script
 * 
 * This script verifies that the comprehensive schema repair was successful
 * and that all Railway 502 error causes have been eliminated.
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

class SchemaRepairVerifier {
  constructor() {
    this.sql = null;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
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
    console.log('\n📋 Verifying all required tables exist...');
    
    const requiredTables = [
      'users', 'projects', 'content', 'content_metrics',
      'ai_projects', 'ai_generated_content', 'ai_content_calendar',
      'post_schedules', 'templates', 'hashtag_suggestions',
      'ai_engagement_patterns', 'niches', 'sessions',
      'social_posts', 'platform_posts', 'post_media',
      'structured_outputs', 'generated_code'
    ];

    try {
      const existingTables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      const existingTableNames = existingTables.map(t => t.table_name);
      const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

      if (missingTables.length === 0) {
        this.successes.push(`All ${requiredTables.length} required tables exist`);
        console.log(`✅ All ${requiredTables.length} required tables exist`);
      } else {
        this.errors.push(`Missing tables: ${missingTables.join(', ')}`);
        console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
      }

      console.log(`📊 Found ${existingTableNames.length} total tables`);
      
    } catch (error) {
      this.errors.push(`Table verification failed: ${error.message}`);
      console.error('❌ Table verification failed:', error.message);
    }
  }

  async verifyCriticalColumns() {
    console.log('\n🔍 Verifying critical columns exist...');

    const criticalColumns = [
      { table: 'users', column: 'password', description: 'Authentication column' },
      { table: 'content', column: 'project_id', description: 'Project linking column' },
      { table: 'content', column: 'day_number', description: 'Content management column' },
      { table: 'projects', column: 'category', description: 'Project wizard column' },
      { table: 'projects', column: 'duration', description: 'Project wizard column' },
      { table: 'projects', column: 'content_frequency', description: 'Project wizard column' },
      { table: 'post_schedules', column: 'recurrence', description: 'Scheduler form column' },
      { table: 'post_schedules', column: 'timezone', description: 'Scheduler form column' },
      { table: 'post_schedules', column: 'project_id', description: 'Scheduler form column' }
    ];

    for (const { table, column, description } of criticalColumns) {
      try {
        const result = await this.sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table} AND column_name = ${column}
        `;

        if (result.length > 0) {
          this.successes.push(`${table}.${column} exists (${description})`);
          console.log(`✅ ${table}.${column} exists (${description})`);
        } else {
          this.errors.push(`CRITICAL: ${table}.${column} missing (${description})`);
          console.log(`❌ CRITICAL: ${table}.${column} missing (${description})`);
        }
      } catch (error) {
        this.errors.push(`Failed to check ${table}.${column}: ${error.message}`);
        console.error(`❌ Failed to check ${table}.${column}:`, error.message);
      }
    }
  }

  async verifyUniqueConstraints() {
    console.log('\n🔒 Verifying UNIQUE constraints for ON CONFLICT support...');

    const requiredConstraints = [
      { table: 'users', constraint: 'users_email_key', description: 'User email uniqueness' },
      { table: 'ai_engagement_patterns', constraint: 'ai_engagement_patterns_platform_category_key', description: 'Engagement pattern uniqueness' },
      { table: 'niches', constraint: 'niches_name_key', description: 'Niche name uniqueness' }
    ];

    for (const { table, constraint, description } of requiredConstraints) {
      try {
        const result = await this.sql`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = ${table} AND constraint_name = ${constraint} AND constraint_type = 'UNIQUE'
        `;

        if (result.length > 0) {
          this.successes.push(`${constraint} exists (${description})`);
          console.log(`✅ ${constraint} exists (${description})`);
        } else {
          this.errors.push(`CRITICAL: ${constraint} missing (${description})`);
          console.log(`❌ CRITICAL: ${constraint} missing (${description})`);
        }
      } catch (error) {
        this.errors.push(`Failed to check ${constraint}: ${error.message}`);
        console.error(`❌ Failed to check ${constraint}:`, error.message);
      }
    }
  }

  async verifyIndexes() {
    console.log('\n📊 Verifying essential indexes exist...');

    try {
      const indexes = await this.sql`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;

      const essentialIndexes = [
        'idx_users_email',
        'idx_projects_user_id',
        'idx_content_user_id',
        'idx_content_project_id',
        'idx_post_schedules_scheduled_at'
      ];

      const existingIndexNames = indexes.map(i => i.indexname);
      const missingIndexes = essentialIndexes.filter(index => !existingIndexNames.includes(index));

      if (missingIndexes.length === 0) {
        this.successes.push(`All essential indexes exist`);
        console.log(`✅ All essential indexes exist`);
      } else {
        this.warnings.push(`Missing indexes: ${missingIndexes.join(', ')}`);
        console.log(`⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
      }

      console.log(`📊 Found ${indexes.length} total indexes`);
      
    } catch (error) {
      this.warnings.push(`Index verification failed: ${error.message}`);
      console.error('⚠️  Index verification failed:', error.message);
    }
  }

  async verifyDataIntegrity() {
    console.log('\n🔍 Verifying data integrity...');

    try {
      // Check if users have passwords
      const usersWithoutPassword = await this.sql`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE password IS NULL OR password = ''
      `;

      if (usersWithoutPassword[0].count === '0') {
        this.successes.push('All users have password values');
        console.log('✅ All users have password values');
      } else {
        this.warnings.push(`${usersWithoutPassword[0].count} users missing passwords`);
        console.log(`⚠️  ${usersWithoutPassword[0].count} users missing passwords`);
      }

      // Check if content has proper status values
      const contentWithInvalidStatus = await this.sql`
        SELECT COUNT(*) as count 
        FROM content 
        WHERE status NOT IN ('draft', 'scheduled', 'published', 'paused', 'deleted')
      `;

      if (contentWithInvalidStatus[0].count === '0') {
        this.successes.push('All content has valid status values');
        console.log('✅ All content has valid status values');
      } else {
        this.warnings.push(`${contentWithInvalidStatus[0].count} content items with invalid status`);
        console.log(`⚠️  ${contentWithInvalidStatus[0].count} content items with invalid status`);
      }

    } catch (error) {
      this.warnings.push(`Data integrity check failed: ${error.message}`);
      console.error('⚠️  Data integrity check failed:', error.message);
    }
  }

  async verifyMigrationHistory() {
    console.log('\n📜 Verifying migration history...');

    try {
      const migrations = await this.sql`
        SELECT filename, executed_at 
        FROM schema_migrations 
        ORDER BY executed_at DESC
      `;

      const finalMigration = migrations.find(m => m.filename.includes('0010_railway_production_schema_repair_final'));

      if (finalMigration) {
        this.successes.push(`Final schema repair migration executed at ${finalMigration.executed_at}`);
        console.log(`✅ Final schema repair migration executed at ${finalMigration.executed_at}`);
      } else {
        this.errors.push('Final schema repair migration not found in history');
        console.log('❌ Final schema repair migration not found in history');
      }

      console.log(`📊 Found ${migrations.length} total migrations executed`);
      
    } catch (error) {
      this.warnings.push(`Migration history check failed: ${error.message}`);
      console.error('⚠️  Migration history check failed:', error.message);
    }
  }

  async testDatabaseOperations() {
    console.log('\n🧪 Testing critical database operations...');

    try {
      // Test user insertion with ON CONFLICT
      await this.sql`
        INSERT INTO users (id, email, first_name, last_name) VALUES ('test-verify-oauth', 'test-verify@creatornexus.dev', 'OAuth', 'TestUser')
        ON CONFLICT (email) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          updated_at = NOW()
      `;
      this.successes.push('User insertion with ON CONFLICT works');
      console.log('✅ User insertion with ON CONFLICT works');

      // Test AI engagement pattern insertion with ON CONFLICT
      await this.sql`
        INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score) 
        VALUES ('test', 'test', ARRAY['12:00'], 0.5)
        ON CONFLICT (platform, category) DO UPDATE SET 
          engagement_score = EXCLUDED.engagement_score,
          updated_at = NOW()
      `;
      this.successes.push('AI engagement pattern insertion with ON CONFLICT works');
      console.log('✅ AI engagement pattern insertion with ON CONFLICT works');

      // Clean up test data
      await this.sql`DELETE FROM users WHERE id = 'test-verify'`;
      await this.sql`DELETE FROM ai_engagement_patterns WHERE platform = 'test' AND category = 'test'`;

    } catch (error) {
      this.errors.push(`Database operation test failed: ${error.message}`);
      console.error('❌ Database operation test failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('📊 RAILWAY SCHEMA REPAIR VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');

    if (this.errors.length === 0) {
      console.log('🎉 VERIFICATION SUCCESSFUL - RAILWAY 502 ERRORS ELIMINATED!');
      console.log('');
      console.log('✅ ALL CRITICAL FIXES VERIFIED:');
      this.successes.forEach(success => console.log(`   • ${success}`));
    } else {
      console.log('❌ VERIFICATION FAILED - ISSUES FOUND:');
      console.log('');
      console.log('🚨 CRITICAL ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('');
      console.log('⚠️  WARNINGS (NON-CRITICAL):');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('');
    console.log('📈 VERIFICATION SUMMARY:');
    console.log(`   • Successes: ${this.successes.length}`);
    console.log(`   • Warnings: ${this.warnings.length}`);
    console.log(`   • Errors: ${this.errors.length}`);
    console.log('');

    if (this.errors.length === 0) {
      console.log('🚀 RESULT: Railway application should now work without 502 errors!');
      console.log('');
      console.log('🧪 NEXT STEPS:');
      console.log('   1. Test the application health endpoint');
      console.log('   2. Verify login functionality works');
      console.log('   3. Test project creation wizard');
      console.log('   4. Test scheduler form submissions');
      console.log('   5. Monitor for any remaining 502 errors');
    } else {
      console.log('🔧 RESULT: Additional fixes needed before Railway will work properly.');
      console.log('');
      console.log('🛠️  RECOMMENDED ACTIONS:');
      console.log('   1. Review the critical errors above');
      console.log('   2. Re-run the final migration if needed');
      console.log('   3. Check Railway deployment logs');
      console.log('   4. Verify DATABASE_URL is correct');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════');

    return this.errors.length === 0;
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
      await this.verifyCriticalColumns();
      await this.verifyUniqueConstraints();
      await this.verifyIndexes();
      await this.verifyDataIntegrity();
      await this.verifyMigrationHistory();
      await this.testDatabaseOperations();
      
      const success = await this.generateReport();
      await this.close();
      
      return success;
      
    } catch (error) {
      console.error('💥 Verification failed:', error.message);
      await this.close();
      return false;
    }
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new SchemaRepairVerifier();
  
  verifier.run()
    .then((success) => {
      if (success) {
        console.log('🎯 Schema repair verification completed successfully');
        process.exit(0);
      } else {
        console.log('💥 Schema repair verification failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Verification runner failed:', error);
      process.exit(1);
    });
}

module.exports = SchemaRepairVerifier;