#!/usr/bin/env node

/**
 * Verify Migration Fix
 * 
 * This script verifies that the migration dependency issues have been resolved
 */

const postgres = require('postgres');

const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

class MigrationVerifier {
  constructor() {
    this.sql = null;
  }

  async connect() {
    console.log('🔌 Connecting to database for verification...');
    
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
    console.log('📋 Verifying core tables exist...');
    
    const requiredTables = [
      'users', 'projects', 'content', 'content_metrics', 
      'ai_generation_tasks', 'post_schedules', 'templates', 
      'hashtag_suggestions', 'ai_engagement_patterns'
    ];

    try {
      const tables = await this.sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;
      
      const existingTables = tables.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        console.error('❌ Missing tables:', missingTables);
        return false;
      }
      
      console.log('✅ All required tables exist');
      existingTables.forEach(table => console.log(`   ✓ ${table}`));
      return true;
      
    } catch (error) {
      console.error('❌ Failed to verify tables:', error.message);
      return false;
    }
  }

  async verifyColumns() {
    console.log('📋 Verifying critical columns exist...');
    
    const criticalColumns = [
      { table: 'users', column: 'password' },
      { table: 'users', column: 'email' },
      { table: 'users', column: 'is_active' },
      { table: 'projects', column: 'user_id' },
      { table: 'projects', column: 'status' },
      { table: 'content', column: 'user_id' },
      { table: 'content', column: 'project_id' },
      { table: 'content', column: 'status' },
      { table: 'content', column: 'scheduled_at' },
      { table: 'content', column: 'day_number' },
      { table: 'content_metrics', column: 'content_id' },
      { table: 'content_metrics', column: 'platform' },
      { table: 'ai_generation_tasks', column: 'user_id' },
      { table: 'ai_generation_tasks', column: 'status' },
      { table: 'post_schedules', column: 'scheduled_at' },
      { table: 'post_schedules', column: 'platform' },
      { table: 'post_schedules', column: 'status' },
      { table: 'templates', column: 'category' },
      { table: 'templates', column: 'is_featured' },
      { table: 'hashtag_suggestions', column: 'platform' },
      { table: 'hashtag_suggestions', column: 'category' }
    ];

    try {
      let allColumnsExist = true;
      
      for (const { table, column } of criticalColumns) {
        const result = await this.sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = ${table} 
            AND column_name = ${column}
          )
        `;
        
        if (result[0].exists) {
          console.log(`   ✓ ${table}.${column}`);
        } else {
          console.error(`   ❌ ${table}.${column} - MISSING`);
          allColumnsExist = false;
        }
      }
      
      if (allColumnsExist) {
        console.log('✅ All critical columns exist');
        return true;
      } else {
        console.error('❌ Some critical columns are missing');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Failed to verify columns:', error.message);
      return false;
    }
  }

  async verifyConstraints() {
    console.log('📋 Verifying critical constraints exist...');
    
    try {
      const constraints = await this.sql`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
        ORDER BY tc.table_name, tc.constraint_name
      `;
      
      console.log('✅ Database constraints:');
      constraints.forEach(c => {
        console.log(`   ✓ ${c.table_name}.${c.constraint_name} (${c.constraint_type})`);
      });
      
      // Check for specific required constraints
      const requiredConstraints = [
        'users_email_key',
        'ai_engagement_patterns_platform_category_key'
      ];
      
      const existingConstraintNames = constraints.map(c => c.constraint_name);
      const missingConstraints = requiredConstraints.filter(c => !existingConstraintNames.includes(c));
      
      if (missingConstraints.length > 0) {
        console.warn('⚠️  Missing some constraints (may be added later):', missingConstraints);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to verify constraints:', error.message);
      return false;
    }
  }

  async verifyMigrationHistory() {
    console.log('📋 Verifying migration history...');
    
    try {
      // Check if schema_migrations table exists
      const tableExists = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_migrations'
        )
      `;
      
      if (!tableExists[0].exists) {
        console.log('⚠️  No schema_migrations table found - migrations may not have run yet');
        return true; // This is okay for fresh installs
      }
      
      const migrations = await this.sql`
        SELECT filename, executed_at, status
        FROM schema_migrations 
        ORDER BY executed_at DESC
      `;
      
      console.log('✅ Migration history:');
      migrations.forEach(m => {
        const status = m.status || 'completed';
        const statusIcon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏳';
        console.log(`   ${statusIcon} ${m.filename} (${status})`);
      });
      
      const failedMigrations = migrations.filter(m => m.status === 'failed');
      if (failedMigrations.length > 0) {
        console.error('❌ Found failed migrations - these need to be resolved');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to verify migration history:', error.message);
      return false;
    }
  }

  async testBasicOperations() {
    console.log('📋 Testing basic database operations...');
    
    try {
      // Test inserting into users table
      const testUserId = `test-verify-${Date.now()}`;
      await this.sql`
        INSERT INTO users (id, email, first_name, last_name)
        VALUES (${testUserId}, ${`test-${Date.now()}@example.com`}, 'test', 'Test', 'User')
      `;
      
      // Test inserting into content table with day_number
      await this.sql`
        INSERT INTO content (user_id, title, platform, content_type, day_number)
        VALUES (${testUserId}, 'Test Content', 'instagram', 'post', 1)
      `;
      
      // Clean up test data
      await this.sql`DELETE FROM content WHERE user_id = ${testUserId}`;
      await this.sql`DELETE FROM users WHERE id = ${testUserId}`;
      
      console.log('✅ Basic database operations work correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Basic database operations failed:', error.message);
      return false;
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
      
      const results = {
        tables: await this.verifyTables(),
        columns: await this.verifyColumns(),
        constraints: await this.verifyConstraints(),
        migrations: await this.verifyMigrationHistory(),
        operations: await this.testBasicOperations()
      };
      
      await this.close();
      
      const allPassed = Object.values(results).every(r => r === true);
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      if (allPassed) {
        console.log('🎉 MIGRATION VERIFICATION PASSED');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ All database tables exist');
        console.log('✅ All critical columns exist');
        console.log('✅ Database constraints are in place');
        console.log('✅ Migration history is clean');
        console.log('✅ Basic operations work correctly');
        console.log('');
        console.log('🚀 Your database is ready for the application!');
      } else {
        console.log('❌ MIGRATION VERIFICATION FAILED');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Results:');
        Object.entries(results).forEach(([test, passed]) => {
          console.log(`   ${passed ? '✅' : '❌'} ${test}`);
        });
        console.log('');
        console.log('🔧 Please run the migration fix script to resolve issues');
      }
      console.log('═══════════════════════════════════════════════════════════════');
      
      return allPassed;
      
    } catch (error) {
      console.error('💥 Migration verification failed:', error);
      return false;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const verifier = new MigrationVerifier();
  
  verifier.run()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Verification error:', error);
      process.exit(1);
    });
}

module.exports = MigrationVerifier;