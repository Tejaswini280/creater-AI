const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function debugAIContentSave() {
  console.log('🔍 Debug AI Content Save Issue');
  console.log('================================\n');
  
  try {
    console.log('🚀 Making AI content generation request...');
    
    const response = await fetch(`${BASE_URL}/api/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        platform: 'youtube',
        contentType: 'video',
        tone: 'professional',
        duration: '1-3 minutes',
        targetAudience: 'young professionals',
        keywords: 'productivity tips'
      })
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Request failed: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Request successful!');
    console.log('📋 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Now check if the data was actually saved to database
    console.log('\n🔍 Checking if data was saved to database...');
    
    // Wait a moment for database save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { Client } = require('pg');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'creators_dev_db',
      user: 'postgres',
      password: '',
    });
    
    await client.connect();
    
    // Check for the specific content ID
    const contentId = data.content?.id;
    if (contentId) {
      console.log(`🔍 Looking for content with ID: ${contentId}`);
      
      const result = await client.query('SELECT * FROM content WHERE id = $1', [contentId]);
      
      if (result.rows.length > 0) {
        console.log('✅ Content found in database!');
        console.log('📋 Database record:');
        console.log(JSON.stringify(result.rows[0], null, 2));
      } else {
        console.log('❌ Content NOT found in database!');
        console.log('🔍 This means the database save failed silently.');
        
        // Check recent content to see what's actually in the database
        const recentContent = await client.query(`
          SELECT id, title, platform, content_type, ai_generated, created_at 
          FROM content 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        console.log('\n📋 Recent content in database:');
        if (recentContent.rows.length === 0) {
          console.log('   No content found in database');
        } else {
          recentContent.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.title} (${row.platform}) - AI: ${row.ai_generated}`);
          });
        }
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugAIContentSave().catch(console.error);