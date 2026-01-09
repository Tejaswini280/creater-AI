#!/usr/bin/env node

/**
 * CRITICAL DATABASE FORM-TO-DATABASE MAPPING FIX
 * 
 * This script applies the critical fixes identified in the comprehensive audit:
 * 1. Adds missing columns to projects table for project wizard fields
 * 2. Adds missing columns to post_schedules table for scheduler fields
 * 3. Adds seed data for templates, hashtags, and niches
 * 4. Creates performance indexes
 * 
 * PRODUCTION SAFE: No foreign keys, idempotent operations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const getDatabaseConfig = () => {
  // Try Railway production first
  if (process.env.DATABASE_URL) {
    console.log('🚀 Using Railway DATABASE_URL');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'creators_dev_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

async function runMigration() {
  const client = new Client(getDatabaseConfig());
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '9999_critical_form_database_mapping_fix.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📝 Migration file loaded, size:', migrationSQL.length, 'characters');

    // Execute the migration
    console.log('🚀 Executing critical database fixes...');
    console.log('⚠️  This may take a few minutes for large databases...');
    
    const startTime = Date.now();
    const result = await client.query(migrationSQL);
    const endTime = Date.now();
    
    console.log('✅ Migration executed successfully!');
    console.log('⏱️  Execution time:', (endTime - startTime) / 1000, 'seconds');
    
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Migration results:');
      result.rows.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    }

    // Verify the fixes were applied
    console.log('🔍 Verifying database fixes...');
    
    // Check projects table columns
    const projectsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('content_type', 'category', 'duration', 'content_frequency', 'brand_voice')
      ORDER BY column_name;
    `);
    
    console.log('📋 Projects table new columns:');
    projectsColumns.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    // Check post_schedules table columns
    const schedulesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'post_schedules' 
      AND column_name IN ('title', 'description', 'content_type', 'tone', 'target_audience')
      ORDER BY column_name;
    `);
    
    console.log('📋 Post schedules table new columns:');
    schedulesColumns.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    // Check seed data
    const templatesCount = await client.query('SELECT COUNT(*) as count FROM templates');
    const hashtagsCount = await client.query('SELECT COUNT(*) as count FROM hashtag_suggestions');
    const nichesCount = await client.query('SELECT COUNT(*) as count FROM niches');
    
    console.log('📊 Seed data verification:');
    console.log(`   ✓ Templates: ${templatesCount.rows[0].count} records`);
    console.log(`   ✓ Hashtag suggestions: ${hashtagsCount.rows[0].count} records`);
    console.log(`   ✓ Niches: ${nichesCount.rows[0].count} records`);

    // Check indexes
    const indexesCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename IN ('projects', 'post_schedules', 'templates', 'hashtag_suggestions')
      AND indexname LIKE 'idx_%';
    `);
    
    console.log(`📊 Performance indexes: ${indexesCount.rows[0].count} indexes created`);

    console.log('\n🎉 CRITICAL DATABASE FIXES COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Fixed Issues:');
    console.log('   • Added missing project wizard fields to projects table');
    console.log('   • Added missing scheduler fields to post_schedules table');
    console.log('   • Added seed data for templates, hashtags, and niches');
    console.log('   • Created performance indexes');
    console.log('   • All operations are production-safe (no foreign keys)');
    console.log('');
    console.log('🚀 Your application should now work correctly with:');
    console.log('   • Project wizard form submissions');
    console.log('   • Content scheduler form submissions');
    console.log('   • Template library functionality');
    console.log('   • Hashtag suggestions');
    console.log('   • Niche recommendations');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check database connection settings');
    console.error('   2. Ensure database exists and is accessible');
    console.error('   3. Verify user has CREATE/ALTER permissions');
    console.error('   4. Check if migration file exists');
    console.error('');
    console.error('💡 This migration is idempotent - safe to run multiple times');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Handle script execution
if (require.main === module) {
  console.log('🚀 CRITICAL DATABASE FORM-TO-DATABASE MAPPING FIX');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('');
  
  runMigration().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };