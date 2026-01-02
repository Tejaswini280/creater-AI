import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test configuration with authentication
const testConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // Mock token for testing
  }
};

async function testRealFrontendScenario() {
  console.log('🔧 Testing Real Frontend Scenario...\n');

  // Test 1: Schedule Content with exact frontend data from image
  console.log('1. Testing Schedule Content (Real Frontend Data)...');
  try {
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, {
      title: 'Morning routine',
      description: 'Daily workout content',
      platform: 'youtube',
      contentType: 'video',
      scheduledDate: '2025-08-25T00:00:00.000Z', // August 25th, 2025 from image
      scheduledTime: '06:30', // 06:30 from image
      autoPost: true,
      timezone: 'Asia/Calcutta',
      // Note: In real scenario, editingContent?.id might be undefined
      id: undefined // Simulating no existing content ID
    }, testConfig);
    
    if (scheduleResponse.status === 200) {
      console.log('✅ Schedule Content (Real Frontend): 200 SUCCESS');
      console.log('   Response:', scheduleResponse.data);
    } else {
      console.log('❌ Schedule Content (Real Frontend):', scheduleResponse.status, scheduleResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Schedule Content (Real Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 2: Schedule Content with content ID (editing scenario)
  console.log('\n2. Testing Schedule Content (With Content ID)...');
  try {
    const scheduleResponse2 = await axios.post(`${BASE_URL}/api/content/schedule`, {
      title: 'Morning routine',
      description: 'Daily workout content',
      platform: 'youtube',
      contentType: 'video',
      scheduledDate: '2025-08-25T00:00:00.000Z',
      scheduledTime: '06:30',
      autoPost: true,
      timezone: 'Asia/Calcutta',
      id: 'content-123' // Simulating existing content ID
    }, testConfig);
    
    if (scheduleResponse2.status === 200) {
      console.log('✅ Schedule Content (With ID): 200 SUCCESS');
      console.log('   Response:', scheduleResponse2.data);
    } else {
      console.log('❌ Schedule Content (With ID):', scheduleResponse2.status, scheduleResponse2.statusText);
    }
  } catch (error) {
    console.log('❌ Schedule Content (With ID) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 3: AI Voiceover with exact frontend data from image
  console.log('\n3. Testing AI Voiceover (Real Frontend Data)...');
  try {
    const voiceoverResponse = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      text: 'heyy !! How are you?',  // Exact text from image
      voice: 'nova',  // Nova (Female) from image
      speed: 1.0,     // 1x from image
      language: 'en'  // English from image
    }, testConfig);
    
    if (voiceoverResponse.status === 200) {
      console.log('✅ AI Voiceover (Real Frontend): 200 SUCCESS');
      console.log('   Response:', voiceoverResponse.data);
    } else {
      console.log('❌ AI Voiceover (Real Frontend):', voiceoverResponse.status, voiceoverResponse.statusText);
    }
  } catch (error) {
    console.log('❌ AI Voiceover (Real Frontend) Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  console.log('\n🔍 Real Frontend Scenario Test Complete');
}

// Run the tests
testRealFrontendScenario().catch(console.error); 