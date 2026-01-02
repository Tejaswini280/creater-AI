import fetch from 'node-fetch';

async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints for real data integration...\n');

  const baseUrl = 'http://localhost:5000';
  
  // Test 1: Health check
  console.log('1️⃣ Testing health check...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: AI Script Generation
  console.log('\n2️⃣ Testing AI script generation...');
  try {
    const scriptResponse = await fetch(`${baseUrl}/api/ai/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see the response
      },
      body: JSON.stringify({
        topic: 'AI in Content Creation',
        platform: 'youtube',
        duration: '60 seconds'
      })
    });
    
    if (scriptResponse.status === 401) {
      console.log('⚠️ Script generation requires authentication (expected)');
    } else {
      const scriptData = await scriptResponse.json();
      console.log('✅ Script generation response:', scriptData);
    }
  } catch (error) {
    console.log('❌ Script generation failed:', error.message);
  }

  // Test 3: Content Ideas Generation
  console.log('\n3️⃣ Testing content ideas generation...');
  try {
    const ideasResponse = await fetch(`${baseUrl}/api/ai/content-ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        niche: 'Technology',
        platform: 'youtube',
        count: 3
      })
    });
    
    if (ideasResponse.status === 401) {
      console.log('⚠️ Content ideas generation requires authentication (expected)');
    } else {
      const ideasData = await ideasResponse.json();
      console.log('✅ Content ideas response:', ideasData);
    }
  } catch (error) {
    console.log('❌ Content ideas generation failed:', error.message);
  }

  // Test 4: Analytics Performance
  console.log('\n4️⃣ Testing analytics performance...');
  try {
    const analyticsResponse = await fetch(`${baseUrl}/api/analytics/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        content: 'AI-powered content creation tutorial',
        platform: 'youtube',
        audience: 'content creators'
      })
    });
    
    if (analyticsResponse.status === 401) {
      console.log('⚠️ Analytics requires authentication (expected)');
    } else {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Analytics response:', analyticsData);
    }
  } catch (error) {
    console.log('❌ Analytics failed:', error.message);
  }

  console.log('\n🎯 API verification complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Check if the server is running on port 5000');
  console.log('2. Verify that the AI services are properly initialized');
  console.log('3. Test with proper authentication tokens');
  console.log('4. Check browser console for any frontend errors');
}

testAPIEndpoints().catch(console.error);
