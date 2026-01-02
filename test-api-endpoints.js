import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token';

const testConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
};

async function testAPIEndpoints() {
  console.log('🔧 Testing API Endpoints...\n');

  // Test 1: Generate Content
  console.log('1. Testing Generate Content API...');
  try {
    const contentResponse = await axios.post(`${BASE_URL}/api/ai/generate-content`, {
      platform: 'youtube',
      contentType: 'script',
      tone: 'Conversational',
      duration: '60 seconds',
      targetAudience: 'General audience',
      keywords: 'test, content, generation'
    }, testConfig);
    
    console.log('✅ Generate Content API:', contentResponse.status, contentResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (!contentResponse.data.success) {
      console.log('❌ Error:', contentResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Generate Content API Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 2: Generate Voiceover
  console.log('\n2. Testing Generate Voiceover API...');
  try {
    const voiceoverResponse = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      script: 'This is a test script for voiceover generation.',
      voice: 'nova',
      speed: 1.0,
      format: 'mp3',
      quality: 'hd'
    }, testConfig);
    
    console.log('✅ Generate Voiceover API:', voiceoverResponse.status, voiceoverResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (!voiceoverResponse.data.success) {
      console.log('❌ Error:', voiceoverResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Generate Voiceover API Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 3: Schedule Content (Updated parameters)
  console.log('\n3. Testing Schedule Content API...');
  try {
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, {
      contentId: 'test-content-123',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      platform: 'youtube',
      contentType: 'video',
      title: 'Test Scheduled Post',
      description: 'This is a test scheduled post'
    }, testConfig);
    
    console.log('✅ Schedule Content API:', scheduleResponse.status, scheduleResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (!scheduleResponse.data.success) {
      console.log('❌ Error:', scheduleResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Schedule Content API Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 4: Generate Thumbnail
  console.log('\n4. Testing Generate Thumbnail API...');
  try {
    const thumbnailResponse = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'A professional thumbnail for a tech video',
      platform: 'youtube',
      style: 'modern'
    }, testConfig);
    
    console.log('✅ Generate Thumbnail API:', thumbnailResponse.status, thumbnailResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (!thumbnailResponse.data.success) {
      console.log('❌ Error:', thumbnailResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Generate Thumbnail API Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 5: Check if server is running
  console.log('\n5. Testing Server Status...');
  try {
    const statusResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server Status:', statusResponse.status, 'Server is running');
  } catch (error) {
    console.log('❌ Server Status Error:', error.response?.status || 'Server not responding');
  }

  console.log('\n🔍 API Endpoint Test Complete');
}

// Run the tests
testAPIEndpoints().catch(console.error); 