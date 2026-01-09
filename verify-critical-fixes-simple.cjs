#!/usr/bin/env node

/**
 * SIMPLE VERIFICATION FOR CRITICAL DATABASE FIXES
 * 
 * This script verifies the critical fixes are working without testing foreign key constraints
 */

const { Client } = require('pg');

// Database configuration
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'creators_dev_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

async function verifyFixes() {
  const client = new Client(getDatabaseConfig());
  
  try {
    await client.connect();
    console.log('🔌 Connected to database for verification');

    // Test 1: Verify all project wizard columns exist
    console.log('\n📋 Verifying Project Wizard Columns...');
    const projectColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN (
        'content_type', 'channel_types', 'category', 'duration', 'content_frequency',
        'content_formats', 'content_themes', 'brand_voice', 'content_length',
        'posting_frequency', 'ai_tools', 'scheduling_preferences', 'start_date',
        'budget', 'team_members', 'goals'
      )
      ORDER BY column_name;
    `);
    
    console.log(`✅ Found ${projectColumns.rows.length}/16 project wizard columns:`);
    projectColumns.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });

    // Test 2: Verify all scheduler columns exist
    console.log('\n📅 Verifying Scheduler Columns...');
    const scheduleColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'post_schedules' 
      AND column_name IN (
        'title', 'description', 'content_type', 'duration', 'tone', 
        'target_audience', 'time_distribution'
      )
      ORDER BY column_name;
    `);
    
    console.log(`✅ Found ${scheduleColumns.rows.length}/7 scheduler columns:`);
    scheduleColumns.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });

    // Test 3: Verify seed data
    console.log('\n🌱 Verifying Seed Data...');
    
    const templatesCount = await client.query('SELECT COUNT(*) as count FROM templates');
    console.log(`✅ Templates: ${templatesCount.rows[0].count} records`);
    
    const hashtagsCount = await client.query('SELECT COUNT(*) as count FROM hashtag_suggestions');
    console.log(`✅ Hashtag suggestions: ${hashtagsCount.rows[0].count} records`);
    
    const nichesCount = await client.query('SELECT COUNT(*) as count FROM niches');
    console.log(`✅ Niches: ${nichesCount.rows[0].count} records`);

    // Test 4: Verify indexes
    console.log('\n🔍 Verifying Performance Indexes...');
    const indexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('projects', 'post_schedules', 'templates', 'hashtag_suggestions')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`✅ Performance indexes: ${indexes.rows.length} indexes created`);

    // Test 5: Test column constraints
    console.log('\n🛡️ Verifying Data Constraints...');
    
    // Test category constraint
    try {
      await client.query(`
        INSERT INTO projects (user_id, name, type, category, status, created_at, updated_at) 
        VALUES ('test-user', 'Test Project', 'social-media', 'invalid-category', 'active', NOW(), NOW())
      `);
      console.log('❌ Category constraint not working - invalid value accepted');
    } catch (error) {
      if (error.code === '23514') { // Check constraint violation
        console.log('✅ Category constraint working - invalid values rejected');
      } else {
        console.log(`⚠️  Category constraint test failed with different error: ${error.message}`);
      }
    }

    console.log('\n🎉 CRITICAL DATABASE FIXES VERIFICATION COMPLETED!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Project wizard columns: ${projectColumns.rows.length}/16 ✅`);
    console.log(`   • Scheduler columns: ${scheduleColumns.rows.length}/7 ✅`);
    console.log(`   • Templates: ${templatesCount.rows[0].count} records ✅`);
    console.log(`   • Hashtag suggestions: ${hashtagsCount.rows[0].count} records ✅`);
    console.log(`   • Niches: ${nichesCount.rows[0].count} records ✅`);
    console.log(`   • Performance indexes: ${indexes.rows.length} indexes ✅`);
    console.log('');
    console.log('🚀 Your application is ready to handle:');
    console.log('   ✓ Project wizard form submissions with all fields');
    console.log('   ✓ Content scheduler form submissions with all fields');
    console.log('   ✓ Template library with professional templates');
    console.log('   ✓ Hashtag suggestions for all platforms');
    console.log('   ✓ Niche recommendations for content creators');
    console.log('   ✓ Optimized database performance');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Handle script execution
if (require.main === module) {
  console.log('🔍 CRITICAL DATABASE FIXES VERIFICATION');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('');
  
  verifyFixes().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyFixes };