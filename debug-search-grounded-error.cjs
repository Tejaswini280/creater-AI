const fetch = require('node-fetch');

async function debugSearchGroundedError() {
  console.log('🔍 Debugging Search Grounded 400 Error...\n');

  try {
    // Test 1: Check what the exact error response is
    console.log('📋 Test 1: Sending request to search-grounded endpoint');
    
    const testPayload = {
      query: "What are the latest trends in AI video generation?",
      context: "I'm a content creator looking to understand emerging technologies."
    };
    
    console.log('Payload being sent:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('http://localhost:5000/api/gemini/search-grounded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Try without auth first to see if that's the issue
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 400) {
      try {
        const errorData = JSON.parse(responseText);
        console.log('\n📊 Parsed Error Details:');
        console.log('Error:', errorData.error);
        if (errorData.details) {
          console.log('Validation Details:');
          errorData.details.forEach((detail, index) => {
            console.log(`  ${index + 1}. Field: ${detail.field}, Message: ${detail.message}`);
          });
        }
      } catch (parseError) {
        console.log('Could not parse error response as JSON');
      }
    }
    
    // Test 2: Try with authentication
    console.log('\n📋 Test 2: Testing with authentication requirement');
    
    const authResponse = await fetch('http://localhost:5000/api/gemini/search-grounded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail but show auth error
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Auth test status:', authResponse.status);
    const authResponseText = await authResponse.text();
    console.log('Auth test response:', authResponseText);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSearchGroundedError();