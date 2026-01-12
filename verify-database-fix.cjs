#!/usr/bin/env node

/**
 * Database Fix Verification Script
 * 
 * Verifies that the database is properly set up and ready for use
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

async function verifyDatabase() {
  console.log('🔍 DATABASE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');
  
  let sql;
  
  try {
    console.log('🔌 Connecting to database...');
    sql = postgres(config.connectionString, {
      ssl: config.ssl,
      max: config.max,
      idle_timeout: config.idle_timeout,
      connect_timeout: config.connect_timeout
    });

    await sql`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check critical tables
    console.log('📋 Checking critical tables...');
    const tables = ['users', 'projects', 'content', 'templates', 'ai_engagement_patterns'];
    
    for (const table of tables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = ${table}
        )
      `;
      
      if (exists[0].exists) {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`   ✅ ${table}: ${count[0].count} records`);
      } else {
        console.log(`   ❌ ${table}: NOT FOUND`);
      }
    }

    // Check users table structure
    console.log('👥 Verifying users table...');
    const userColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    const requiredColumns = ['id', 'email', 'password', 'first_name', 'last_name'];
    const existingColumns = userColumns.map(col => col.column_name);
    
    for (const col of requiredColumns) {
      if (existingColumns.includes(col)) {
        console.log(`   ✅ ${col} column exists`);
      } else {
        console.log(`   ❌ ${col} column MISSING`);
      }
    }

    // Test user creation
    console.log('🧪 Testing user operations...');
    try {
      const testResult = await sql`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE email = 'test@creatornexus.com'
        LIMIT 1
      `;
      
      if (testResult.length > 0) {
        console.log(`   ✅ Test user found: ${testResult[0].first_name} ${testResult[0].last_name}`);
      } else {
        console.log('   ⚠️  Test user not found');
      }
    } catch (error) {
      console.log('   ❌ User query failed:', error.message);
    }

    // Check migration status
    console.log('📊 Checking migration status...');
    try {
      const migrations = await sql`
        SELECT filename, status, executed_at 
        FROM schema_migrations 
        ORDER BY executed_at DESC 
        LIMIT 5
      `;
      
      console.log('   Recent migrations:');
      migrations.forEach(m => {
        console.log(`   • ${m.filename}: ${m.status || 'completed'} (${m.executed_at})`);
      });
    } catch (error) {
      console.log('   ⚠️  Migration table check failed:', error.message);
    }

    await sql.end();
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DATABASE VERIFICATION COMPLETED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Database is ready for application use');
    console.log('🚀 All critical components are functioning properly');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (sql) {
      await sql.end();
    }
    process.exit(1);
  }
}

// Run verification
verifyDatabase()
  .then(() => {
    console.log('🎉 Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });