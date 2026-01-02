const fetch = require('node-fetch');

async function testSearchGroundedValidation() {
  console.log('🧪 Testing Search Grounded Validation...\n');

  try {
    const testPayload = {
      query: "What are the latest trends in AI video generation?",
      context: "I'm a content creator looking to understand emerging technologies."
    };
    
    console.log('📋 Testing validation with test endpoint (no auth)');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('http://localhost:5000/api/gemini/search-grounded-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Validation working correctly!');
      const data = JSON.parse(responseText);
      console.log('📊 Response structure:');
      console.log('  - Success:', data.success);
      console.log('  - Query:', data.query);
      console.log('  - Context:', data.context);
      console.log('  - Summary:', data.summary ? '✅' : '❌');
      console.log('  - Key Points:', Array.isArray(data.keyPoints) ? `✅ (${data.keyPoints.length})` : '❌');
      console.log('  - Creator Insights:', Array.isArray(data.creatorInsights) ? `✅ (${data.creatorInsights.length})` : '❌');
    } else {
      console.log('❌ Validation failed');
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.details || errorData.errors) {
          console.log('Validation errors:');
          (errorData.details || errorData.errors).forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.field}: ${error.message}`);
          });
        }
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSearchGroundedValidation();