const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugThumbnailGeneration() {
  console.log('🔍 Debugging Thumbnail Generation...\n');

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
    console.log('Testing Thumbnail Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: "AI tools for content creators - modern, vibrant, professional",
      style: "vibrant",
      platform: "youtube"
    }, TEST_CONFIG);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.result?.imageUrl) {
      console.log('\n✅ Thumbnail generated successfully!');
      console.log('Image URL:', response.data.result.imageUrl);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.log('Error details:', error.response.data.error);
    }
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

debugThumbnailGeneration().catch(console.error);
