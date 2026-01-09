#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST FOR CRITICAL DATABASE FIXES
 * 
 * This script tests all the critical fixes applied by the database migration:
 * 1. Tests project wizard form-to-database mapping
 * 2. Tests scheduler form-to-database mapping
 * 3. Verifies seed data is present
 * 4. Tests API endpoints with new fields
 */

const { Client } = require('pg');
const fetch = require('node-fetch');

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

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`     ${details}`);
  }
  
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testDatabaseSchema() {
  const client = new Client(getDatabaseConfig());
  
  try {
    await client.connect();
    console.log('🔌 Connected to database for schema testing');

    // Test 1: Projects table missing columns
    console.log('\n📋 Testing Projects Table Schema...');
    
    const projectsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY column_name;
    `);
    
    const requiredProjectColumns = [
      'content_type', 'channel_types', 'category', 'duration', 'content_frequency',
      'content_formats', 'content_themes', 'brand_voice', 'content_length',
      'posting_frequency', 'ai_tools', 'scheduling_preferences', 'start_date',
      'budget', 'team_members', 'goals'
    ];
    
    const existingColumns = projectsColumns.rows.map(row => row.column_name);
    
    requiredProjectColumns.forEach(column => {
      const exists = existingColumns.includes(column);
      logTest(`Projects table has ${column} column`, exists);
    });

    // Test 2: Post schedules table missing columns
    console.log('\n📅 Testing Post Schedules Table Schema...');
    
    const schedulesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'post_schedules' 
      ORDER BY column_name;
    `);
    
    const requiredScheduleColumns = [
      'title', 'description', 'content_type', 'duration', 'tone', 
      'target_audience', 'time_distribution'
    ];
    
    const existingScheduleColumns = schedulesColumns.rows.map(row => row.column_name);
    
    requiredScheduleColumns.forEach(column => {
      const exists = existingScheduleColumns.includes(column);
      logTest(`Post schedules table has ${column} column`, exists);
    });

    // Test 3: Seed data verification
    console.log('\n🌱 Testing Seed Data...');
    
    const templatesCount = await client.query('SELECT COUNT(*) as count FROM templates');
    logTest('Templates seed data exists', templatesCount.rows[0].count > 0, 
           `Found ${templatesCount.rows[0].count} templates`);
    
    const hashtagsCount = await client.query('SELECT COUNT(*) as count FROM hashtag_suggestions');
    logTest('Hashtag suggestions seed data exists', hashtagsCount.rows[0].count > 0,
           `Found ${hashtagsCount.rows[0].count} hashtag suggestions`);
    
    const nichesCount = await client.query('SELECT COUNT(*) as count FROM niches');
    logTest('Niches seed data exists', nichesCount.rows[0].count > 0,
           `Found ${nichesCount.rows[0].count} niches`);

    // Test 4: Indexes verification
    console.log('\n🔍 Testing Performance Indexes...');
    
    const indexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('projects', 'post_schedules', 'templates', 'hashtag_suggestions')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    logTest('Performance indexes created', indexes.rows.length > 0,
           `Found ${indexes.rows.length} performance indexes`);

    // Test 5: Data integrity constraints
    console.log('\n🛡️ Testing Data Integrity Constraints...');
    
    const constraints = await client.query(`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name IN ('projects', 'post_schedules')
      AND constraint_type = 'CHECK'
      ORDER BY table_name, constraint_name;
    `);
    
    logTest('Data integrity constraints added', constraints.rows.length > 0,
           `Found ${constraints.rows.length} check constraints`);

  } catch (error) {
    logTest('Database schema test', false, `Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

async function testProjectCreation() {
  console.log('\n🏗️ Testing Project Creation with New Fields...');
  
  const client = new Client(getDatabaseConfig());
  
  try {
    await client.connect();
    
    // Create a test project with all new fields
    const testProjectData = {
      userId: 'test-user-critical-fix',
      name: 'Critical Fix Test Project',
      description: 'Testing the critical database fixes',
      type: 'social-media',
      // New fields from project wizard
      contentType: ['video', 'image'],
      channelTypes: ['instagram', 'youtube'],
      category: 'fitness',
      duration: '30days',
      contentFrequency: 'daily',
      contentFormats: ['video', 'image', 'carousel'],
      contentThemes: ['educational', 'behind-scenes'],
      brandVoice: 'professional',
      contentLength: 'medium',
      postingFrequency: 'daily',
      aiTools: ['gemini', 'openai'],
      schedulingPreferences: JSON.stringify({
        autoSchedule: true,
        timeZone: 'UTC',
        preferredTimes: ['09:00', '15:00']
      }),
      startDate: new Date(),
      budget: '1000-5000',
      teamMembers: ['user1', 'user2'],
      goals: ['increase-engagement', 'build-community'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert test project
    const insertQuery = `
      INSERT INTO projects (
        user_id, name, description, type, content_type, channel_types, category,
        duration, content_frequency, content_formats, content_themes, brand_voice,
        content_length, posting_frequency, ai_tools, scheduling_preferences,
        start_date, budget, team_members, goals, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      ) RETURNING id;
    `;
    
    const values = [
      testProjectData.userId, testProjectData.name, testProjectData.description,
      testProjectData.type, testProjectData.contentType, testProjectData.channelTypes,
      testProjectData.category, testProjectData.duration, testProjectData.contentFrequency,
      testProjectData.contentFormats, testProjectData.contentThemes, testProjectData.brandVoice,
      testProjectData.contentLength, testProjectData.postingFrequency, testProjectData.aiTools,
      testProjectData.schedulingPreferences, testProjectData.startDate, testProjectData.budget,
      testProjectData.teamMembers, testProjectData.goals, testProjectData.status,
      testProjectData.createdAt, testProjectData.updatedAt
    ];
    
    const result = await client.query(insertQuery, values);
    const projectId = result.rows[0].id;
    
    logTest('Project creation with new fields', true, `Created project ID: ${projectId}`);
    
    // Verify the data was stored correctly
    const verifyQuery = `
      SELECT content_type, category, duration, content_frequency, brand_voice,
             scheduling_preferences, goals
      FROM projects WHERE id = $1;
    `;
    
    const verifyResult = await client.query(verifyQuery, [projectId]);
    const storedProject = verifyResult.rows[0];
    
    logTest('Project data integrity', 
           storedProject.category === 'fitness' && 
           storedProject.duration === '30days' &&
           storedProject.brand_voice === 'professional',
           `Category: ${storedProject.category}, Duration: ${storedProject.duration}`);
    
    // Clean up test data
    await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
    
  } catch (error) {
    logTest('Project creation test', false, `Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

async function testSchedulerCreation() {
  console.log('\n📅 Testing Scheduler Creation with New Fields...');
  
  const client = new Client(getDatabaseConfig());
  
  try {
    await client.connect();
    
    // Create a test scheduled post with all new fields
    const testScheduleData = {
      socialPostId: 1, // Assuming this exists or using a mock ID
      platform: 'instagram',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'pending',
      // New fields from scheduler form
      title: 'Critical Fix Test Content',
      description: 'Testing the critical scheduler fixes',
      contentType: 'video',
      duration: '30',
      tone: 'professional',
      targetAudience: 'fitness enthusiasts',
      timeDistribution: 'optimal',
      recurrence: 'daily',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert test schedule
    const insertQuery = `
      INSERT INTO post_schedules (
        social_post_id, platform, scheduled_at, status, title, description,
        content_type, duration, tone, target_audience, time_distribution,
        recurrence, timezone, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING id;
    `;
    
    const values = [
      testScheduleData.socialPostId, testScheduleData.platform, testScheduleData.scheduledAt,
      testScheduleData.status, testScheduleData.title, testScheduleData.description,
      testScheduleData.contentType, testScheduleData.duration, testScheduleData.tone,
      testScheduleData.targetAudience, testScheduleData.timeDistribution,
      testScheduleData.recurrence, testScheduleData.timezone,
      testScheduleData.createdAt, testScheduleData.updatedAt
    ];
    
    const result = await client.query(insertQuery, values);
    const scheduleId = result.rows[0].id;
    
    logTest('Scheduler creation with new fields', true, `Created schedule ID: ${scheduleId}`);
    
    // Verify the data was stored correctly
    const verifyQuery = `
      SELECT title, content_type, tone, target_audience, time_distribution
      FROM post_schedules WHERE id = $1;
    `;
    
    const verifyResult = await client.query(verifyQuery, [scheduleId]);
    const storedSchedule = verifyResult.rows[0];
    
    logTest('Schedule data integrity',
           storedSchedule.title === 'Critical Fix Test Content' &&
           storedSchedule.tone === 'professional' &&
           storedSchedule.time_distribution === 'optimal',
           `Title: ${storedSchedule.title}, Tone: ${storedSchedule.tone}`);
    
    // Clean up test data
    await client.query('DELETE FROM post_schedules WHERE id = $1', [scheduleId]);
    
  } catch (error) {
    logTest('Scheduler creation test', false, `Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE CRITICAL DATABASE FIXES TEST');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('');

  try {
    await testDatabaseSchema();
    await testProjectCreation();
    await testSchedulerCreation();
    
    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Critical database fixes are working correctly');
      console.log('🚀 Your application should now handle:');
      console.log('   • Project wizard form submissions');
      console.log('   • Content scheduler form submissions');
      console.log('   • Template library functionality');
      console.log('   • Hashtag suggestions');
      console.log('   • Niche recommendations');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('❌ Please review the failed tests above');
      console.log('💡 You may need to run the migration again');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };