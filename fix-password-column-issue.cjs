#!/usr/bin/env node

/**
 * Quick Fix for Password Column Issue
 * 
 * This script adds the missing password column to the users table
 * and then runs the seeding process safely.
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

async function fixPasswordColumn() {
  console.log('🔧 FIXING PASSWORD COLUMN ISSUE');
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

    // Check if password column exists
    console.log('🔍 Checking if password column exists...');
    const passwordColumnExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
      )
    `;

    if (!passwordColumnExists[0].exists) {
      console.log('➕ Adding password column to users table...');
      await sql`
        ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'temp_password_needs_reset'
      `;
      console.log('✅ Password column added successfully');
    } else {
      console.log('✅ Password column already exists');
    }

    // Check if users table has any data
    console.log('👥 Checking existing users...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`📊 Found ${userCount[0].count} existing users`);

    // Try to create test user safely
    console.log('👤 Creating test user (if needed)...');
    try {
      const result = await sql`
        INSERT INTO users (id, email, password, first_name, last_name, is_active)
        VALUES (
          'test-user-id',
          'test@creatornexus.com',
          '$2b$10$rQZ8qNqZ8qNqZ8qNqZ8qNOe',
          'Test',
          'User',
          true
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      if (result.length > 0) {
        console.log('✅ Test user created: test@creatornexus.com');
      } else {
        console.log('⏭️  Test user already exists');
      }
    } catch (error) {
      console.log('⚠️  Test user creation skipped:', error.message);
    }

    // Verify the fix
    console.log('🔍 Verifying database structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('📋 Users table structure:');
    columns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    await sql.end();
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ PASSWORD COLUMN ISSUE FIXED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Database is now ready for normal operation');
    console.log('🚀 You can now restart your application');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    if (sql) {
      await sql.end();
    }
    process.exit(1);
  }
}

// Run the fix
fixPasswordColumn()
  .then(() => {
    console.log('🎉 Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });