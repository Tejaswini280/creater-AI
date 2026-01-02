const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugIdeasGeneration() {
  console.log('🔍 Debugging Ideas Generation...\n');

  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Failed to get authentication token');
    return;
  }

  const TEST_CONFIG = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    console.log('Testing Ideas Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-ideas`, {
      niche: "technology",
      platform: "youtube",
      count: 5,
      style: "viral"
    }, TEST_CONFIG);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.ideas) {
      console.log('\nIdeas received:');
      response.data.ideas.forEach((idea, index) => {
        console.log(`${index + 1}. ${idea}`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password'
    });
    
    if (response.data.accessToken) {
      console.log('✅ Got auth token');
      return response.data.accessToken;
    }
  } catch (error) {
    console.log('❌ Auth failed:', error.response?.data?.message || error.message);
  }
  return null;
}

debugIdeasGeneration().catch(console.error);
