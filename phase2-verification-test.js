import axios from 'axios';
import WebSocket from 'ws';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'User'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
const logTest = (testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   Details: ${details}`);
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
  }
  testResults.details.push({ testName, passed, details });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication helper
let authToken = null;

const authenticate = async () => {
  try {
    console.log('\n🔐 Testing Authentication...');
    
    // Try to register first
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
      logTest('User Registration', true, 'User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        logTest('User Registration', true, 'User already exists');
      } else {
        logTest('User Registration', false, error.response?.data?.message || error.message);
      }
    }
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = loginResponse.data.accessToken;
    logTest('User Login', true, 'Login successful');
    
    return true;
  } catch (error) {
    logTest('Authentication', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Phase 2.1: Gemini AI Integration Tests
const testGeminiIntegration = async () => {
  console.log('\n🤖 Testing Gemini AI Integration (Task 2.1)...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // Test 1: Text Generation
  try {
    const textResponse = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: "Write a short creative story about a robot learning to paint",
      maxTokens: 500,
      temperature: 0.7
    }, { headers });
    
    logTest('Gemini Text Generation', true, 'Text generated successfully');
  } catch (error) {
    logTest('Gemini Text Generation', false, error.response?.data?.message || error.message);
  }
  
  // Test 2: Structured Output Generation
  try {
    const structuredResponse = await axios.post(`${BASE_URL}/api/gemini/generate-structured`, {
      prompt: "Create a blog post about AI in education",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    }, { headers });
    
    logTest('Gemini Structured Output', true, 'Structured output generated');
  } catch (error) {
    logTest('Gemini Structured Output', false, error.response?.data?.message || error.message);
  }
  
  // Test 3: Code Generation
  try {
    const codeResponse = await axios.post(`${BASE_URL}/api/gemini/generate-code`, {
      description: "Create a simple React component for a todo list",
      language: "javascript",
      framework: "react"
    }, { headers });
    
    logTest('Gemini Code Generation', true, 'Code generated successfully');
  } catch (error) {
    logTest('Gemini Code Generation', false, error.response?.data?.message || error.message);
  }
  
  // Test 4: Content Optimization
  try {
    const optimizeResponse = await axios.post(`${BASE_URL}/api/gemini/optimize-content`, {
      content: "This is a sample blog post about technology trends in 2024.",
      platform: "youtube",
      goals: ["engagement", "views"]
    }, { headers });
    
    logTest('Gemini Content Optimization', true, 'Content optimized successfully');
  } catch (error) {
    logTest('Gemini Content Optimization', false, error.response?.data?.message || error.message);
  }
  
  // Test 5: Advanced Content Generation
  try {
    const advancedResponse = await axios.post(`${BASE_URL}/api/gemini/generate-advanced-content`, {
      type: "script",
      topic: "Sustainable living tips",
      context: {
        audience: "young adults",
        tone: "informative",
        length: "5 minutes",
        platform: "youtube"
      }
    }, { headers });
    
    logTest('Gemini Advanced Content Generation', true, 'Advanced content generated');
  } catch (error) {
    logTest('Gemini Advanced Content Generation', false, error.response?.data?.message || error.message);
  }
  
  // Test 6: Document Analysis
  try {
    const analysisResponse = await axios.post(`${BASE_URL}/api/gemini/analyze-document`, {
      text: "Artificial Intelligence is transforming industries worldwide. Companies are adopting AI to improve efficiency and create new opportunities.",
      analysisType: "summary"
    }, { headers });
    
    logTest('Gemini Document Analysis', true, 'Document analyzed successfully');
  } catch (error) {
    logTest('Gemini Document Analysis', false, error.response?.data?.message || error.message);
  }
  
  // Test 7: Search Grounded Response
  try {
    const searchResponse = await axios.post(`${BASE_URL}/api/gemini/search-grounded`, {
      query: "What are the latest trends in AI?",
      context: "Focus on practical applications in business"
    }, { headers });
    
    logTest('Gemini Search Grounded Response', true, 'Search response generated');
  } catch (error) {
    logTest('Gemini Search Grounded Response', false, error.response?.data?.message || error.message);
  }
};

// Phase 2.2: Media AI Features Tests
const testMediaAIFeatures = async () => {
  console.log('\n🎨 Testing Media AI Features (Task 2.2)...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // Test 1: Thumbnail Generation (DALL-E 3)
  try {
    const thumbnailResponse = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: "A futuristic tech workspace with AI elements",
      style: "modern",
      aspectRatio: "16:9"
    }, { headers });
    
    logTest('DALL-E 3 Thumbnail Generation', true, 'Thumbnail generation endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('DALL-E 3 Thumbnail Generation', false, 'Endpoint not implemented');
    } else {
      logTest('DALL-E 3 Thumbnail Generation', false, error.response?.data?.message || error.message);
    }
  }
  
  // Test 2: Voiceover Generation (TTS-HD)
  try {
    const voiceoverResponse = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      text: "Welcome to our AI-powered content creation platform",
      voice: "alloy",
      speed: 1.0
    }, { headers });
    
    logTest('TTS-HD Voiceover Generation', true, 'Voiceover generation endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('TTS-HD Voiceover Generation', false, 'Endpoint not implemented');
    } else {
      logTest('TTS-HD Voiceover Generation', false, error.response?.data?.message || error.message);
    }
  }
};

// Phase 2.3: Streaming AI Tests
const testStreamingAI = async () => {
  console.log('\n🌊 Testing Streaming AI Implementation (Task 2.3)...');
  
  // Test WebSocket connection
  try {
    const ws = new WebSocket('ws://localhost:5000');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        logTest('WebSocket Connection', true, 'WebSocket server is running');
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        logTest('WebSocket Connection', false, error.message);
        reject(error);
      });
    });
  } catch (error) {
    logTest('WebSocket Connection', false, 'WebSocket server not available');
  }
  
  // Test streaming generation endpoint
  try {
    const streamingResponse = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: "Write a short story about space exploration",
      stream: true
    }, { 
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    logTest('Streaming AI Generation', true, 'Streaming endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Streaming AI Generation', false, 'Endpoint not implemented');
    } else {
      logTest('Streaming AI Generation', false, error.response?.data?.message || error.message);
    }
  }
};

// Phase 2.4: Analytics & Intelligence Tests
const testAnalyticsIntelligence = async () => {
  console.log('\n📊 Testing Analytics & Intelligence (Task 2.4)...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // Test 1: Performance Prediction
  try {
    const predictionResponse = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: "Sample video content about AI trends",
      platform: "youtube",
      audience: "tech enthusiasts"
    }, { headers });
    
    logTest('Performance Prediction', true, 'Prediction endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Performance Prediction', false, 'Endpoint not implemented');
    } else {
      logTest('Performance Prediction', false, error.response?.data?.message || error.message);
    }
  }
  
  // Test 2: Competitor Analysis
  try {
    const competitorResponse = await axios.post(`${BASE_URL}/api/analytics/analyze-competitors`, {
      niche: "tech education",
      competitors: ["TechCrunch", "Verge", "Wired"]
    }, { headers });
    
    logTest('Competitor Analysis', true, 'Competitor analysis endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Competitor Analysis', false, 'Endpoint not implemented');
    } else {
      logTest('Competitor Analysis', false, error.response?.data?.message || error.message);
    }
  }
  
  // Test 3: Monetization Strategy
  try {
    const monetizationResponse = await axios.post(`${BASE_URL}/api/analytics/generate-monetization`, {
      content: "Educational tech videos",
      audience: "developers and tech professionals",
      platform: "youtube"
    }, { headers });
    
    logTest('Monetization Strategy', true, 'Monetization endpoint exists');
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Monetization Strategy', false, 'Endpoint not implemented');
    } else {
      logTest('Monetization Strategy', false, error.response?.data?.message || error.message);
    }
  }
};

// Main test execution
const runPhase2Tests = async () => {
  console.log('🚀 PHASE 2 VERIFICATION TEST');
  console.log('============================');
  console.log('Testing AI Integration & Advanced Features');
  console.log('==========================================\n');
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await delay(3000);
  
  // Test authentication first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  // Run all Phase 2 tests
  await testGeminiIntegration();
  await testMediaAIFeatures();
  await testStreamingAI();
  await testAnalyticsIntelligence();
  
  // Print summary
  console.log('\n📋 PHASE 2 TEST SUMMARY');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n🎯 PHASE 2 IMPLEMENTATION STATUS:');
  if (testResults.passed >= 15) {
    console.log('✅ EXCELLENT - Most features working');
  } else if (testResults.passed >= 10) {
    console.log('🟡 GOOD - Core features working, some improvements needed');
  } else if (testResults.passed >= 5) {
    console.log('🟠 FAIR - Basic features working, significant work needed');
  } else {
    console.log('🔴 POOR - Most features broken, requires major implementation');
  }
};

// Run tests
runPhase2Tests().catch(console.error); 