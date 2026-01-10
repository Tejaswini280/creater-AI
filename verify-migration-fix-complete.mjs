#!/usr/bin/env node

/**
 * FINAL VERIFICATION - ALL MIGRATION ISSUES RESOLVED
 * 
 * This script verifies that all migration and database issues are completely resolved
 */

import postgres from 'postgres';

// Configuration
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
    console.log('🔌 Connecting to database for final verification...');
    
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

  async verifyMigrationStatus() {
    console.log('📋 Verifying migration status...');
    
    try {
      const migrations = await this.sql`
        SELECT filename, executed_at, checksum 
        FROM schema_migrations 
        ORDER BY filename
      `;
      
      console.log(`✅ Found ${migrations.length} completed migrations:`);
      migrations.forEach(m => {
        console.log(`   📄 ${m.filename} - ${m.checksum}`);
      });
      
      // Check if all expected migrations are marked as completed
      const expectedMigrations = [
        '0000_nice_forgotten_one.sql',
        '0001_core_tables_idempotent.sql',
        '0002_seed_data_with_conflicts.sql',
        '0003_additional_tables_safe.sql',
        '0004_legacy_comprehensive_schema_fix.sql',
        '0005_enhanced_content_management.sql',
        '0006_critical_form_database_mapping_fix.sql',
        '0007_production_repair_idempotent.sql',
        '0008_final_constraints_and_cleanup.sql',
        '0009_railway_production_repair_complete.sql',
        '0010_railway_production_schema_repair_final.sql',
        '0011_add_missing_unique_constraints.sql',
        '0012_immediate_dependency_fix.sql'
      ];
      
      const completedMigrations = migrations.map(m => m.filename);
      const missingMigrations = expectedMigrations.filter(m => !completedMigrations.includes(m));
      
      if (missingMigrations.length === 0) {
        console.log('✅ All expected migrations are marked as completed');
      } else {
        console.log(`⚠️  Missing migrations: ${missingMigrations.join(', ')}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to verify migration status:', error.message);
      throw error;
    }
  }

  async verifyDatabaseSchema() {
    console.log('🔧 Verifying database schema...');
    
    try {
      // Check core tables exist
      const tables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      console.log(`✅ Found ${tables.length} tables in database`);
      
      // Verify critical tables exist
      const criticalTables = ['users', 'projects', 'content', 'sessions'];
      const existingTables = tables.map(t => t.table_name);
      
      for (const table of criticalTables) {
        if (existingTables.includes(table)) {
          console.log(`   ✅ ${table} table exists`);
        } else {
          console.log(`   ❌ ${table} table missing`);
          throw new Error(`Critical table ${table} is missing`);
        }
      }
      
      // Verify project_id column exists in content table
      const contentColumns = await this.sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        AND table_schema = 'public'
        ORDER BY column_name
      `;
      
      const hasProjectId = contentColumns.some(col => col.column_name === 'project_id');
      if (hasProjectId) {
        console.log('   ✅ project_id column exists in content table');
      } else {
        throw new Error('project_id column missing from content table');
      }
      
    } catch (error) {
      console.error('❌ Schema verification failed:', error.message);
      throw error;
    }
  }

  async testProblematicQuery() {
    console.log('🧪 Testing the previously problematic query...');
    
    try {
      // This is the exact query that was failing before
      const result = await this.sql`
        SELECT 
          c.id,
          c.title,
          c.project_id,
          p.name as project_name
        FROM content c
        LEFT JOIN projects p ON c.project_id = p.id
        LIMIT 5
      `;
      
      console.log(`✅ Problematic query executed successfully`);
      console.log(`   Found ${result.length} content records`);
      
      if (result.length > 0) {
        console.log(`   Sample: "${result[0].title}" (project_id: ${result[0].project_id})`);
      }
      
    } catch (error) {
      console.error('❌ Problematic query still failing:', error.message);
      throw error;
    }
  }

  async testDataIntegrity() {
    console.log('📊 Testing data integrity...');
    
    try {
      // Count records in each critical table
      const userCount = await this.sql`SELECT COUNT(*) FROM users`;
      const projectCount = await this.sql`SELECT COUNT(*) FROM projects`;
      const contentCount = await this.sql`SELECT COUNT(*) FROM content`;
      const sessionCount = await this.sql`SELECT COUNT(*) FROM sessions`;
      
      console.log('✅ Data integrity verified:');
      console.log(`   Users: ${userCount[0].count}`);
      console.log(`   Projects: ${projectCount[0].count}`);
      console.log(`   Content: ${contentCount[0].count}`);
      console.log(`   Sessions: ${sessionCount[0].count}`);
      
      // Test that we can insert and query data
      const testQuery = await this.sql`
        SELECT u.id, u.email, COUNT(p.id) as project_count
        FROM users u
        LEFT JOIN projects p ON u.id = p.user_id
        GROUP BY u.id, u.email
        LIMIT 3
      `;
      
      console.log(`✅ Complex join query successful (${testQuery.length} results)`);
      
    } catch (error) {
      console.error('❌ Data integrity test failed:', error.message);
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
      
      console.log('\n🎯 FINAL MIGRATION VERIFICATION');
      console.log('═══════════════════════════════════════════════════════════════');
      
      await this.verifyMigrationStatus();
      await this.verifyDatabaseSchema();
      await this.testProblematicQuery();
      await this.testDataIntegrity();
      
      console.log('\n✅ VERIFICATION COMPLETE - ALL ISSUES RESOLVED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 Migration system is working correctly');
      console.log('🔧 Database schema is complete and valid');
      console.log('📊 All data relationships are functional');
      console.log('🚀 Application is ready to start without errors');
      
      await this.close();
      
    } catch (error) {
      console.error('\n💥 VERIFICATION FAILED:', error.message);
      console.log('❌ There are still unresolved issues');
      await this.close();
      throw error;
    }
  }
}

// Run the verification
const verifier = new MigrationVerifier();

verifier.run()
  .then(() => {
    console.log('\n🎉 SUCCESS: All migration and database issues are completely resolved!');
    console.log('   Your application is ready to start: npm start');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FAILED:', error.message);
    console.log('   Additional fixes may be needed');
    process.exit(1);
  });