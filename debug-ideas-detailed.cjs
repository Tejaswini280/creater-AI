const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugIdeasGeneration() {
  console.log('🔍 DETAILED IDEAS GENERATION DEBUG');
  console.log('=' .repeat(50));

  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Failed to get authentication token');
    return;
  }

  console.log('✅ Got auth token, testing ideas generation...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-ideas`, {
      niche: "technology",
      platform: "youtube",
      count: 5,
      contentType: "video"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 RESPONSE STATUS:', response.status);
    console.log('📊 RESPONSE DATA:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check if it's real data or fallback
    const ideas = response.data.ideas || [];
    const hasRealIdeas = ideas.length > 0 && 
      ideas.every(idea => idea && idea.length > 10) &&
      !ideas.some(idea => idea.includes('technology Tips Everyone Should Know'));

    console.log('\n🔍 ANALYSIS:');
    console.log('Ideas count:', ideas.length);
    console.log('First idea:', ideas[0]);
    console.log('Last idea:', ideas[ideas.length - 1]);
    console.log('Contains fallback pattern:', ideas.some(idea => idea.includes('Tips Everyone Should Know')));
    console.log('Is real data:', hasRealIdeas);

    if (!hasRealIdeas) {
      console.log('\n❌ ISSUE DETECTED: Using fallback data');
      console.log('This means OpenAIService.generateContentIdeas() is throwing an error');
      console.log('Check server logs for the exact error message');
    } else {
      console.log('\n✅ SUCCESS: Using real AI data');
    }

  } catch (error) {
    console.log('❌ REQUEST FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error:', error.message);
  }
}

async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password'
    });
    
    if (response.data.accessToken) {
      return response.data.accessToken;
    }
  } catch (error) {
    console.log('❌ Auth failed:', error.response?.data?.message || error.message);
  }
  return null;
}

debugIdeasGeneration().catch(console.error);
