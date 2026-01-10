#!/usr/bin/env node

/**
 * DATABASE FIX VERIFICATION SCRIPT
 * 
 * This script verifies that the database schema fix resolved all issues
 */

import postgres from 'postgres';

// Database configuration
const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

async function verifyDatabaseFix() {
  console.log('🔍 VERIFYING DATABASE SCHEMA FIX');
  console.log('═══════════════════════════════════════════════════════════════');

  let sql;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    sql = postgres(config.connectionString, {
      ssl: config.ssl,
      max: config.max,
      idle_timeout: config.idle_timeout,
      connect_timeout: config.connect_timeout
    });

    await sql`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check all critical tables and columns
    const checks = [
      {
        name: 'Users table exists',
        query: sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'users'`,
        expected: 1
      },
      {
        name: 'Users table has password column',
        query: sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'`,
        expected: 1
      },
      {
        name: 'Content table exists',
        query: sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'content'`,
        expected: 1
      },
      {
        name: 'Content table has project_id column',
        query: sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'project_id'`,
        expected: 1
      },
      {
        name: 'Post_schedules table exists',
        query: sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'post_schedules'`,
        expected: 1
      },
      {
        name: 'Post_schedules table has project_id column',
        query: sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'post_schedules' AND column_name = 'project_id'`,
        expected: 1
      },
      {
        name: 'Schema_migrations table exists',
        query: sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'schema_migrations'`,
        expected: 1
      },
      {
        name: 'All migrations marked as applied',
        query: sql`SELECT COUNT(*) as count FROM schema_migrations`,
        expected: 12
      }
    ];

    console.log('');
    console.log('🔍 Running verification checks...');
    console.log('');

    let allPassed = true;

    for (const check of checks) {
      try {
        const result = await check.query;
        const count = result.length || result[0]?.count || 0;
        
        if (count >= check.expected) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name} - Expected: ${check.expected}, Got: ${count}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${check.name} - Error: ${error.message}`);
        allPassed = false;
      }
    }

    console.log('');
    
    if (allPassed) {
      console.log('🎉 ALL VERIFICATION CHECKS PASSED!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ Database schema is correctly fixed');
      console.log('✅ All required tables exist');
      console.log('✅ All required columns exist');
      console.log('✅ Migration tracking is set up');
      console.log('');
      console.log('🚀 Your application should now start without migration errors!');
    } else {
      console.log('❌ SOME VERIFICATION CHECKS FAILED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('The database schema fix may not have been applied correctly.');
      console.log('Please run the fix script again: node apply-root-cause-fix.cjs');
      throw new Error('Database verification failed');
    }

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error.message);
    throw error;
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the verification
verifyDatabaseFix()
  .then(() => {
    console.log('✅ Database verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database verification failed:', error);
    process.exit(1);
  });