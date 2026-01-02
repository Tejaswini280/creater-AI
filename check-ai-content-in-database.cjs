const { Client } = require('pg');

// Database configuration from .env
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'creators_dev_db',
  user: 'postgres',
  password: '', // Empty password as per .env
};

async function checkAIContentInDatabase() {
  console.log('🔍 Checking AI Content in Database...');
  console.log('=====================================\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database:', dbConfig.database);
    console.log('');
    
    // Check if content table exists
    console.log('📋 Checking if content table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Content table does not exist!');
      return;
    }
    
    console.log('✅ Content table exists');
    console.log('');
    
    // Check total content count
    console.log('📊 Checking total content records...');
    const totalCount = await client.query('SELECT COUNT(*) FROM content');
    console.log(`Total content records: ${totalCount.rows[0].count}`);
    console.log('');
    
    // Check AI-generated content count
    console.log('🤖 Checking AI-generated content...');
    const aiCount = await client.query('SELECT COUNT(*) FROM content WHERE ai_generated = true');
    console.log(`AI-generated content records: ${aiCount.rows[0].count}`);
    console.log('');
    
    // Get recent AI content (last 10 records)
    console.log('📝 Recent AI-generated content:');
    const recentAI = await client.query(`
      SELECT id, title, platform, content_type, status, created_at, 
             SUBSTRING(script, 1, 100) as content_preview
      FROM content 
      WHERE ai_generated = true 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (recentAI.rows.length === 0) {
      console.log('❌ No AI-generated content found in database');
    } else {
      console.log(`✅ Found ${recentAI.rows.length} AI-generated content records:`);
      console.log('');
      
      recentAI.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Platform: ${row.platform}`);
        console.log(`   Type: ${row.content_type}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Content Preview: ${row.content_preview}...`);
        console.log('');
      });
    }
    
    // Check for specific test user content
    console.log('👤 Checking content for test user (EAzLepQUX10UODF54_Ge-)...');
    const testUserContent = await client.query(`
      SELECT id, title, platform, content_type, ai_generated, created_at
      FROM content 
      WHERE user_id = 'EAzLepQUX10UODF54_Ge-'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (testUserContent.rows.length === 0) {
      console.log('❌ No content found for test user');
    } else {
      console.log(`✅ Found ${testUserContent.rows.length} content records for test user:`);
      testUserContent.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.title} (${row.platform}) - AI: ${row.ai_generated} - ${row.created_at}`);
      });
    }
    console.log('');
    
    // Check table structure
    console.log('🏗️ Content table structure (AI-related columns):');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'content' 
      AND column_name IN ('ai_generated', 'day_number', 'is_paused', 'is_stopped', 'can_publish', 'publish_order', 'content_version', 'last_regenerated_at')
      ORDER BY ordinal_position
    `);
    
    if (columns.rows.length > 0) {
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
    } else {
      console.log('❌ No AI-related columns found in content table');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Database connection refused. Make sure:');
      console.log('   - PostgreSQL is running on localhost:5432');
      console.log('   - Database "creators_dev_db" exists');
      console.log('   - User "postgres" has access');
    }
  } finally {
    await client.end();
  }
}

// Run the check
checkAIContentInDatabase().catch(console.error);