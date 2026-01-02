import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Use the test token that's supported by the authentication middleware
let authToken = 'test-token';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    console.log(`❌ ${testName} - FAILED: ${error?.message || 'Unknown error'}`);
  }
}

async function authenticate() {
  try {
    console.log('🔐 Testing authentication...');
    
    // Test if the server is running and authentication works
    const response = await axios.get(`${BASE_URL}/api/auth/user`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Authentication successful with test token');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Using test token for authentication');
    return true; // Continue with test token
  }
}

// ============================================================================
// TASK 2.1: GEMINI AI INTEGRATION TESTS
// ============================================================================

async function testGeminiIntegration() {
  console.log('\n🎯 TESTING TASK 2.1: GEMINI AI INTEGRATION');
  console.log('=' .repeat(60));

  // Test 2.1.1: Text Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: 'Write a short story about AI and creativity'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result;
    logTest('Gemini Text Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Text Generation', false, error);
  }

  // Test 2.1.2: Structured Output Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-structured`, {
      prompt: 'Create a content plan for a tech blog',
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          schedule: { type: "string" }
        }
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.title;
    logTest('Gemini Structured Output', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Structured Output', false, error);
  }

  // Test 2.1.3: Code Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-code`, {
      description: 'Create a function to calculate fibonacci numbers',
      language: 'javascript'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.code;
    logTest('Gemini Code Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Code Generation', false, error);
  }

  // Test 2.1.4: Content Optimization
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/optimize-content`, {
      content: 'This is a sample blog post about technology trends.',
      platform: 'linkedin',
      goals: ['engagement', 'reach']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.optimizedContent;
    logTest('Gemini Content Optimization', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Content Optimization', false, error);
  }

  // Test 2.1.5: Advanced Content Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-advanced-content`, {
      type: 'blog',
      topic: 'The Future of AI in Content Creation',
      context: {
        audience: 'Content creators',
        tone: 'Professional',
        length: 'Medium',
        platform: 'LinkedIn'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.content;
    logTest('Gemini Advanced Content Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Advanced Content Generation', false, error);
  }

  // Test 2.1.6: Document Analysis
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/analyze-document`, {
      text: 'This is a sample document about content creation strategies and best practices.',
      analysisType: 'summary'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.summary;
    logTest('Gemini Document Analysis', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Document Analysis', false, error);
  }

  // Test 2.1.7: Search Grounded Response
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/search-grounded`, {
      query: 'What are the latest trends in content creation?',
      context: 'Content creation industry analysis'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.result && response.data.result.response;
    logTest('Gemini Search Grounded Response', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Gemini Search Grounded Response', false, error);
  }
}

// ============================================================================
// TASK 2.2: MEDIA AI FEATURES TESTS
// ============================================================================

async function testMediaAIFeatures() {
  console.log('\n🎯 TESTING TASK 2.2: MEDIA AI FEATURES');
  console.log('=' .repeat(60));

  // Test 2.2.1: Thumbnail Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'Professional thumbnail for a tech tutorial video',
      style: 'modern',
      aspectRatio: '16:9',
      size: '1792x1024'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.imageUrl;
    logTest('DALL-E 3 Thumbnail Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('DALL-E 3 Thumbnail Generation', false, error);
  }

  // Test 2.2.2: Voiceover Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      script: 'Welcome to our tutorial on AI-powered content creation. Today we will explore the latest tools and techniques.',
      voice: 'alloy',
      speed: 1.0,
      format: 'mp3'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.audioUrl;
    logTest('TTS-HD Voiceover Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('TTS-HD Voiceover Generation', false, error);
  }

  // Test 2.2.3: Thumbnail Variations
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail-variations`, {
      prompt: 'Tech tutorial thumbnail',
      count: 3
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.variations && response.data.result.variations.length > 0;
    logTest('Thumbnail Variations Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Thumbnail Variations Generation', false, error);
  }

  // Test 2.2.4: Voiceover Variations
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-voiceover-variations`, {
      text: 'This is a sample text for voiceover generation with different voices.',
      voices: ['alloy', 'echo', 'nova']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.variations && response.data.result.variations.length > 0;
    logTest('Voiceover Variations Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Voiceover Variations Generation', false, error);
  }

  // Test 2.2.5: Platform Optimized Thumbnail
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-platform-thumbnail`, {
      prompt: 'Tech tutorial content',
      platform: 'youtube'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.imageUrl && response.data.result.platform;
    logTest('Platform Optimized Thumbnail', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Platform Optimized Thumbnail', false, error);
  }
}

// ============================================================================
// TASK 2.3: STREAMING AI TESTS
// ============================================================================

async function testStreamingAI() {
  console.log('\n🎯 TESTING TASK 2.3: STREAMING AI IMPLEMENTATION');
  console.log('=' .repeat(60));

  // Test 2.3.1: Basic Streaming Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Write a creative story about a content creator discovering AI tools',
      model: 'gemini',
      temperature: 0.7,
      maxTokens: 500,
      streamSpeed: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.content && response.data.result.streamData;
    logTest('Basic Streaming Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Basic Streaming Generation', false, error);
  }

  // Test 2.3.2: OpenAI Streaming Generation
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Create a script for a YouTube video about content creation tips',
      model: 'openai',
      temperature: 0.8,
      maxTokens: 300,
      streamSpeed: 'fast'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.content && response.data.result.metadata;
    logTest('OpenAI Streaming Generation', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('OpenAI Streaming Generation', false, error);
  }

  // Test 2.3.3: Slow Speed Streaming
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Write a detailed blog post about AI trends in 2024',
      model: 'gemini',
      temperature: 0.5,
      maxTokens: 800,
      streamSpeed: 'slow'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.streamData && response.data.result.streamData.length > 10;
    logTest('Slow Speed Streaming', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Slow Speed Streaming', false, error);
  }

  // Test 2.3.4: Streaming with Different Temperatures
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: 'Generate creative ideas for social media content',
      model: 'gemini',
      temperature: 0.9,
      maxTokens: 200,
      streamSpeed: 'normal'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.content;
    logTest('High Temperature Streaming', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('High Temperature Streaming', false, error);
  }
}

// ============================================================================
// TASK 2.4: ANALYTICS & INTELLIGENCE TESTS
// ============================================================================

async function testAnalyticsIntelligence() {
  console.log('\n🎯 TESTING TASK 2.4: ANALYTICS & INTELLIGENCE');
  console.log('=' .repeat(60));

  // Test 2.4.1: Performance Prediction
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: 'This is a sample video about AI tools for content creators. We will explore the latest technologies and how they can improve your workflow.',
      platform: 'youtube',
      audience: 'Content creators and digital marketers'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.predictedViews && response.data.result.recommendations;
    logTest('Performance Prediction', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Performance Prediction', false, error);
  }

  // Test 2.4.2: Competitor Analysis
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-competitors`, {
      niche: 'Tech tutorials',
      competitors: ['TechCrunch', 'The Verge', 'Wired']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.marketAnalysis && response.data.result.competitorProfiles;
    logTest('Competitor Analysis', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Competitor Analysis', false, error);
  }

  // Test 2.4.3: Monetization Strategy
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/generate-monetization`, {
      content: 'Educational content about AI and machine learning',
      audience: 'Students and professionals',
      platform: 'youtube'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.revenueStreams && response.data.result.pricingStrategy;
    logTest('Monetization Strategy', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Monetization Strategy', false, error);
  }

  // Test 2.4.4: Content Trend Analysis
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-trends`, {
      niche: 'Content creation',
      timeframe: '30 days'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.trendingTopics && response.data.result.platformTrends;
    logTest('Content Trend Analysis', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Content Trend Analysis', false, error);
  }

  // Test 2.4.5: Audience Analysis
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-audience`, {
      audienceData: {
        demographics: {
          ageRanges: [{ range: '18-24', percentage: 30 }, { range: '25-34', percentage: 40 }],
          locations: [{ location: 'United States', percentage: 60 }],
          interests: ['Technology', 'Education']
        },
        behavior: {
          activeHours: ['6-9 PM', '12-2 PM'],
          engagementPatterns: ['High engagement on weekends'],
          contentPreferences: ['Educational content', 'How-to guides']
        }
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const passed = response.status === 200 && response.data && response.data.success && response.data.result && response.data.result.demographics && response.data.result.behavior;
    logTest('Audience Analysis', passed, passed ? null : new Error('Invalid response'));
  } catch (error) {
    logTest('Audience Analysis', false, error);
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('🚀 STARTING PHASE 2 COMPREHENSIVE TESTING');
  console.log('=' .repeat(60));
  console.log('Testing all Phase 2 tasks: 2.1, 2.2, 2.3, 2.4');
  console.log('=' .repeat(60));

  try {
    // Authenticate first
    await authenticate();

    // Run all Phase 2 tests
    await testGeminiIntegration();
    await testMediaAIFeatures();
    await testStreamingAI();
    await testAnalyticsIntelligence();

    // Print final results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 PHASE 2 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    if (testResults.passed === testResults.total) {
      console.log('\n🎉 ALL PHASE 2 TESTS PASSED! 100% SUCCESS RATE!');
      console.log('✅ Task 2.1: Gemini AI Integration - COMPLETE');
      console.log('✅ Task 2.2: Media AI Features - COMPLETE');
      console.log('✅ Task 2.3: Streaming AI Implementation - COMPLETE');
      console.log('✅ Task 2.4: Analytics & Intelligence - COMPLETE');
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix the issues above.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
runAllTests(); 