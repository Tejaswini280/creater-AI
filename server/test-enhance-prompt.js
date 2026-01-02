// Simple test script for enhance prompt functionality
const { OpenAIService } = require('./services/openai');

async function testEnhancePrompt() {
  console.log('🧪 Testing Enhance Prompt functionality...\n');

  const testPrompt = "Create a video about cats playing";

  try {
    console.log('Original prompt:', testPrompt);
    console.log('Enhancing...');

    const enhancedPrompt = await OpenAIService.enhancePrompt(testPrompt);

    console.log('\n✅ Enhancement successful!');
    console.log('Enhanced prompt:', enhancedPrompt);

  } catch (error) {
    console.error('❌ Enhancement failed:', error.message);
  }
}

// Test the API endpoint directly
async function testAPIEndpoint() {
  console.log('\n🌐 Testing API endpoint...\n');

  const testPrompt = "Create a video about cats playing";

  try {
    // First, let's get a test token (this is for testing only)
    console.log('Getting test authentication token...');

    // For testing purposes, we'll create a simple token
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { id: 1, email: 'test@example.com' },
      'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '1h' }
    );

    console.log('Making API request...');

    const response = await fetch('http://localhost:5000/api/ai/enhance-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        prompt: testPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', data);

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testEnhancePrompt();
  await testAPIEndpoint();
}

runTests().catch(console.error);
