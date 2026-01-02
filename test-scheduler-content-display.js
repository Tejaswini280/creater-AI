import fetch from 'node-fetch';

async function testScheduledContentDisplay() {
  console.log('🔍 Testing Scheduled Content Display...\n');

  const token = 'test-token';

  try {
    // First, create some test content
    console.log('📝 Creating test scheduled content...');
    
    const testContents = [
      {
        title: "Test Video 1",
        description: "First test video for display testing",
        platform: "youtube",
        contentType: "video",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Test Video 2", 
        description: "Second test video for display testing",
        platform: "instagram",
        contentType: "reel",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const content of testContents) {
      const createResponse = await fetch('http://localhost:5000/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(content)
      });

      if (createResponse.ok) {
        const createdContent = await createResponse.json();
        console.log(`✅ Created: ${content.title} (ID: ${createdContent.content.id})`);
      } else {
        console.log(`❌ Failed to create: ${content.title}`);
      }
    }

    // Now fetch scheduled content
    console.log('\n📋 Fetching scheduled content...');
    
    const fetchResponse = await fetch('http://localhost:5000/api/content?status=scheduled', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Fetch response status:', fetchResponse.status);
    
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('📥 Response structure:', Object.keys(data));
      console.log('📥 Content array length:', data.content?.length || 0);
      
      if (data.content && data.content.length > 0) {
        console.log('✅ Scheduled content found:');
        data.content.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.title} (${item.platform}) - ${item.status}`);
        });
      } else {
        console.log('⚠️  No scheduled content found in response');
        console.log('📥 Full response:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ Failed to fetch scheduled content');
      const errorText = await fetchResponse.text();
      console.log('📥 Error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Error testing content display:', error.message);
  }
}

// Test the frontend query endpoint
async function testFrontendQuery() {
  console.log('\n🌐 Testing Frontend Query Endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/content?status=scheduled');
    console.log('📥 Frontend query status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📥 Frontend response structure:', Object.keys(data));
      console.log('📥 Content count:', data.content?.length || 0);
      
      if (data.content && data.content.length > 0) {
        console.log('✅ Frontend can access scheduled content');
      } else {
        console.log('⚠️  Frontend query returned no content');
      }
    } else {
      console.log('❌ Frontend query failed');
    }
  } catch (error) {
    console.error('❌ Frontend query error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testScheduledContentDisplay();
  await testFrontendQuery();
}

runTests().catch(console.error); 