const fetch = require('node-fetch');

async function testSearchGroundedSimple() {
  try {
    console.log('🧪 Testing search grounded endpoint accessibility...');
    
    // Test with empty body to see if endpoint exists
    const response = await fetch('http://localhost:5000/api/gemini/search-grounded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text.substring(0, 200) + '...');
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication');
      console.log('💡 Test through the frontend interface instead');
    } else if (response.status === 400) {
      console.log('✅ Endpoint exists and is validating input correctly');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSearchGroundedSimple();