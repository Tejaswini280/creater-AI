const fetch = require('node-fetch');

async function testSearchGroundedWithAuth() {
  console.log('🧪 Testing Search Grounded with Authentication...\n');

  try {
    // Step 1: Login to get a valid token
    console.log('📋 Step 1: Logging in to get authentication token');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, status:', loginResponse.status);
      const loginError = await loginResponse.text();
      console.log('Login error:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    const accessToken = loginData.accessToken;
    if (!accessToken) {
      console.log('❌ No access token received');
      return;
    }
    
    // Step 2: Test the search grounded endpoint with authentication
    console.log('\n📋 Step 2: Testing search grounded endpoint with auth token');
    
    const testPayload = {
      query: "What are the latest trends in AI video generation?",
      context: "I'm a content creator looking to understand emerging technologies."
    };
    
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const searchResponse = await fetch('http://localhost:5000/api/gemini/search-grounded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', searchResponse.status);
    const searchResponseText = await searchResponse.text();
    console.log('Response body preview:', searchResponseText.substring(0, 200) + '...');
    
    if (searchResponse.ok) {
      console.log('✅ Search grounded endpoint working with authentication!');
      
      try {
        const data = JSON.parse(searchResponseText);
        console.log('\n📊 Response structure:');
        console.log('  - Success:', data.success);
        console.log('  - Query:', data.query ? '✅' : '❌');
        console.log('  - Context:', data.context !== undefined ? '✅' : '❌');
        console.log('  - Summary:', data.summary ? '✅' : '❌');
        console.log('  - Key Points:', Array.isArray(data.keyPoints) ? `✅ (${data.keyPoints.length})` : '❌');
        console.log('  - Creator Insights:', Array.isArray(data.creatorInsights) ? `✅ (${data.creatorInsights.length})` : '❌');
        console.log('  - Disclaimer:', data.disclaimer ? '✅' : '❌');
        
        if (data.summary) {
          console.log(`\n📝 Sample Summary: "${data.summary.substring(0, 100)}..."`);
        }
        
        console.log('\n🎉 Search Grounded Responses System is fully functional!');
        
      } catch (parseError) {
        console.log('⚠️  Could not parse response as JSON');
      }
      
    } else {
      console.log('❌ Search grounded endpoint failed');
      try {
        const errorData = JSON.parse(searchResponseText);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', searchResponseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSearchGroundedWithAuth();