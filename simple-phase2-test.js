import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

console.log('🚀 Testing Phase 2 Features...\n');

// Test authentication
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    // First try to register
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'phase2test@example.com',
        password: 'testpass123',
        firstName: 'Phase2',
        lastName: 'Test'
      });
      console.log('✅ User registered');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('✅ User already exists');
      } else {
        console.log('⚠️ Registration failed:', error.response?.data?.message || error.message);
      }
    }
    
    // Then try to login
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'phase2test@example.com',
      password: 'testpass123'
    });
    console.log('✅ Authentication working');
    return response.data.accessToken;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Gemini AI
async function testGemini(token) {
  if (!token) return false;
  
  try {
    console.log('\n🤖 Testing Gemini AI...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: 'Write a short story about AI'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Gemini AI working');
    return true;
  } catch (error) {
    console.log('❌ Gemini AI failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test Media AI
async function testMediaAI(token) {
  if (!token) return false;
  
  try {
    console.log('\n🎨 Testing Media AI...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'A futuristic AI workspace'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Media AI working');
    return true;
  } catch (error) {
    console.log('❌ Media AI failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test Analytics
async function testAnalytics(token) {
  if (!token) return false;
  
  try {
    console.log('\n📈 Testing Analytics...');
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: { title: 'Test content' },
      platform: 'youtube'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Analytics working');
    return true;
  } catch (error) {
    console.log('❌ Analytics failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test Streaming AI
async function testStreamingAI(token) {
  if (!token) return false;
  
  try {
    console.log('\n⚡ Testing Streaming AI...');
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Write a creative story',
      model: 'gemini'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Streaming AI working');
    return true;
  } catch (error) {
    console.log('❌ Streaming AI failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Main test
async function runTests() {
  const token = await testAuth();
  
  const results = {
    gemini: await testGemini(token),
    mediaAI: await testMediaAI(token),
    analytics: await testAnalytics(token),
    streamingAI: await testStreamingAI(token)
  };
  
  console.log('\n📊 RESULTS:');
  console.log('==========');
  console.log(`🤖 Gemini AI: ${results.gemini ? '✅' : '❌'}`);
  console.log(`🎨 Media AI: ${results.mediaAI ? '✅' : '❌'}`);
  console.log(`📈 Analytics: ${results.analytics ? '✅' : '❌'}`);
  console.log(`⚡ Streaming AI: ${results.streamingAI ? '✅' : '❌'}`);
  
  const total = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall: ${total}/4 features working (${Math.round(total/4*100)}%)`);
}

runTests().catch(console.error); 