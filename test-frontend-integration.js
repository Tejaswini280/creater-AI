import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test configuration with authentication
const testConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // Mock token for testing
  }
};

async function testFrontendIntegration() {
  console.log('🔧 Testing Frontend Integration...\n');

  // Test 1: AI Voiceover with frontend parameters
  console.log('1. Testing AI Voiceover (Frontend Format)...');
  try {
    const voiceoverResponse = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      text: 'heyy !! How are you?',  // Frontend sends 'text' not 'script'
      voice: 'nova',
      speed: 1.0,
      language: 'en'
    }, testConfig);
    
    if (voiceoverResponse.status === 200) {
      console.log('✅ AI Voiceover (Frontend): 200 SUCCESS');
      console.log('   Response:', voiceoverResponse.data);
    } else {
      console.log('❌ AI Voiceover (Frontend):', voiceoverResponse.status, voiceoverResponse.statusText);
    }
  } catch (error) {
    console.log('❌ AI Voiceover (Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 2: Schedule Content with frontend parameters
  console.log('\n2. Testing Schedule Content (Frontend Format)...');
  try {
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, {
      title: 'Morning routine',
      description: 'Daily workout content',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      autoPost: true,
      timezone: 'Asia/Calcutta',
      id: 'test-content-123'  // Frontend sends 'id' not 'contentId'
    }, testConfig);
    
    if (scheduleResponse.status === 200) {
      console.log('✅ Schedule Content (Frontend): 200 SUCCESS');
      console.log('   Response:', scheduleResponse.data);
    } else {
      console.log('❌ Schedule Content (Frontend):', scheduleResponse.status, scheduleResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Schedule Content (Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 3: Generate Content with frontend parameters
  console.log('\n3. Testing Generate Content (Frontend Format)...');
  try {
    const contentResponse = await axios.post(`${BASE_URL}/api/ai/generate-content`, {
      platform: 'youtube',
      contentType: 'script',
      tone: 'professional',
      duration: '60',
      targetAudience: 'general',
      keywords: 'content creation, productivity'
    }, testConfig);
    
    if (contentResponse.status === 200) {
      console.log('✅ Generate Content (Frontend): 200 SUCCESS');
      console.log('   Response:', contentResponse.data);
    } else {
      console.log('❌ Generate Content (Frontend):', contentResponse.status, contentResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Generate Content (Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 4: Generate Thumbnail with frontend parameters
  console.log('\n4. Testing Generate Thumbnail (Frontend Format)...');
  try {
    const thumbnailResponse = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'Professional YouTube thumbnail for content creation',
      platform: 'youtube',
      style: 'modern'
    }, testConfig);
    
    if (thumbnailResponse.status === 200) {
      console.log('✅ Generate Thumbnail (Frontend): 200 SUCCESS');
      console.log('   Response:', thumbnailResponse.data);
    } else {
      console.log('❌ Generate Thumbnail (Frontend):', thumbnailResponse.status, thumbnailResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Generate Thumbnail (Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  console.log('\n🔍 Frontend Integration Test Complete');
}

// Run the tests
testFrontendIntegration().catch(console.error); 