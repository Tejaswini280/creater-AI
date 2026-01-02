const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    console.log('🧪 Testing multimodal analysis endpoint...');
    
    // Test with a simple GET request first to see if the endpoint exists
    const response = await fetch('http://localhost:5000/api/gemini/analyze-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', text.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();