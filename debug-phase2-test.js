import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

console.log('🔍 Debugging Phase 2 Features...\n');

// Test authentication
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    // First try to register
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'debugtest@example.com',
        password: 'testpass123',
        firstName: 'Debug',
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
      email: 'debugtest@example.com',
      password: 'testpass123'
    });
    console.log('✅ Authentication working');
    return response.data.accessToken;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Gemini AI with detailed error info
async function testGemini(token) {
  if (!token) return false;
  
  try {
    console.log('\n🤖 Testing Gemini AI...');
    console.log('  Making request to /api/gemini/generate-text...');
    
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: 'Write a short story about AI'
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('  ✅ Response received:', response.status);
    console.log('  📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('  ❌ Gemini AI failed:');
    console.log('    Status:', error.response?.status);
    console.log('    Message:', error.response?.data?.message || error.message);
    console.log('    Full error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

// Test Media AI with detailed error info
async function testMediaAI(token) {
  if (!token) return false;
  
  try {
    console.log('\n🎨 Testing Media AI...');
    console.log('  Making request to /api/ai/generate-thumbnail...');
    
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'A futuristic AI workspace'
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('  ✅ Response received:', response.status);
    console.log('  📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('  ❌ Media AI failed:');
    console.log('    Status:', error.response?.status);
    console.log('    Message:', error.response?.data?.message || error.message);
    console.log('    Full error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

// Test Analytics with detailed error info
async function testAnalytics(token) {
  if (!token) return false;
  
  try {
    console.log('\n📈 Testing Analytics...');
    console.log('  Making request to /api/analytics/predict-performance...');
    
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: { title: 'Test content' },
      platform: 'youtube'
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('  ✅ Response received:', response.status);
    console.log('  📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('  ❌ Analytics failed:');
    console.log('    Status:', error.response?.status);
    console.log('    Message:', error.response?.data?.message || error.message);
    console.log('    Full error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

// Test Streaming AI with detailed error info
async function testStreamingAI(token) {
  if (!token) return false;
  
  try {
    console.log('\n⚡ Testing Streaming AI...');
    console.log('  Making request to /api/ai/streaming-generate...');
    
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Write a creative story',
      model: 'gemini'
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('  ✅ Response received:', response.status);
    console.log('  📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('  ❌ Streaming AI failed:');
    console.log('    Status:', error.response?.status);
    console.log('    Message:', error.response?.data?.message || error.message);
    console.log('    Full error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

// Test server health
async function testServerHealth() {
  try {
    console.log('\n🏥 Testing server health...');
    
    // Test basic server response - try a known endpoint
    const response = await axios.get(`${BASE_URL}/api/templates`, { timeout: 5000 });
    console.log('  ✅ Server health check:', response.status);
    return true;
  } catch (error) {
    console.log('  ❌ Server health check failed:');
    console.log('    Status:', error.response?.status);
    console.log('    Message:', error.message);
    return false;
  }
}

// Main test
async function runDebugTests() {
  console.log('🔍 Starting detailed Phase 2 debugging...\n');
  
  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not responding properly. Cannot proceed with tests.');
    return;
  }
  
  const token = await testAuth();
  
  const results = {
    gemini: await testGemini(token),
    mediaAI: await testMediaAI(token),
    analytics: await testAnalytics(token),
    streamingAI: await testStreamingAI(token)
  };
  
  console.log('\n📊 DEBUG RESULTS:');
  console.log('================');
  console.log(`🤖 Gemini AI: ${results.gemini ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🎨 Media AI: ${results.mediaAI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📈 Analytics: ${results.analytics ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⚡ Streaming AI: ${results.streamingAI ? '✅ PASS' : '❌ FAIL'}`);
  
  const total = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall: ${total}/4 features working (${Math.round(total/4*100)}%)`);
  
  if (total === 0) {
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. Check if all API keys are properly configured');
    console.log('2. Verify that the services are properly imported in routes.ts');
    console.log('3. Check server logs for detailed error messages');
    console.log('4. Ensure all required dependencies are installed');
  }
}

runDebugTests().catch(console.error); 