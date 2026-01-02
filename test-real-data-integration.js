import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJmaXJzdE5hbWUiOiJUZXN0IiwibGFzdE5hbWUiOiJVc2VyIiwiaWF0IjoxNzU0NTY2NTM3LCJleHAiOjE3NTQ1NzAxMzd9.e-BQyJ-2PdFhW4McOdqFEV8z2ZpfCvADbY_d2YH_EyM'
  }
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function logTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - ${error?.message || 'Failed'}`);
  }
  testResults.details.push({ name: testName, passed, error: error?.message });
}

async function testRealDataIntegration() {
  console.log('🚀 Testing Real Data Integration');
  console.log('=' .repeat(60));
  console.log('This test verifies that all APIs are using real data instead of mock data');
  console.log('');

  // Test 1: AI Generator - Streaming AI
  try {
    console.log('🔍 Testing AI Generator - Streaming AI...');
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: "Create a YouTube script about AI tools for content creators",
      type: "script",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealContent = response.data && 
      response.data.content && 
      response.data.content.length > 100 &&
      !response.data.content.includes('[HOOK - 0:00-0:03]') &&
      !response.data.content.includes('Today we\'re diving deep into AI tools for content creators and trust me');
    
    logTest('AI Generator - Streaming AI', hasRealContent, 
      hasRealContent ? null : new Error('Response contains fallback/mock content'));
  } catch (error) {
    logTest('AI Generator - Streaming AI', false, error);
  }

  // Test 2: AI Generator - Media AI (Thumbnail)
  try {
    console.log('🔍 Testing AI Generator - Media AI (Thumbnail)...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      title: "AI Tools for Content Creators",
      style: "vibrant"
    }, TEST_CONFIG);
    
    const hasRealThumbnail = response.data && 
      response.data.imageUrl &&
      !response.data.imageUrl.includes('via.placeholder.com') &&
      !response.data.imageUrl.includes('AI+Generated+Thumbnail');
    
    logTest('AI Generator - Media AI (Thumbnail)', hasRealThumbnail,
      hasRealThumbnail ? null : new Error('Response contains fallback/mock thumbnail'));
  } catch (error) {
    logTest('AI Generator - Media AI (Thumbnail)', false, error);
  }

  // Test 3: AI Generator - Media AI (Voiceover)
  try {
    console.log('🔍 Testing AI Generator - Media AI (Voiceover)...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      script: "AI tools are revolutionizing content creation",
      voice: "alloy"
    }, TEST_CONFIG);
    
    const hasRealVoiceover = response.data && 
      response.data.audioUrl &&
      !response.data.audioUrl.includes('fallback') &&
      !response.data.audioUrl.includes('mock');
    
    logTest('AI Generator - Media AI (Voiceover)', hasRealVoiceover,
      hasRealVoiceover ? null : new Error('Response contains fallback/mock voiceover'));
  } catch (error) {
    logTest('AI Generator - Media AI (Voiceover)', false, error);
  }

  // Test 4: AI Generator - AI Agent
  try {
    console.log('🔍 Testing AI Generator - AI Agent...');
    const response = await axios.post(`${BASE_URL}/api/ai/agents/content-pipeline`, {
      niche: "tech tutorials",
      platforms: ["youtube"],
      frequency: "daily",
      contentTypes: ["video"]
    }, TEST_CONFIG);
    
    const hasRealAgent = response.data && 
      response.data.agentId &&
      !response.data.agentId.includes('fallback') &&
      !response.data.agentId.includes('mock');
    
    logTest('AI Generator - AI Agent', hasRealAgent,
      hasRealAgent ? null : new Error('Response contains fallback/mock agent'));
  } catch (error) {
    logTest('AI Generator - AI Agent', false, error);
  }

  // Test 5: AI Generator - Predictive AI
  try {
    console.log('🔍 Testing AI Generator - Predictive AI...');
    const response = await axios.post(`${BASE_URL}/api/ai/analytics/predict-performance`, {
      title: "AI Tools for Content Creators",
      platform: "youtube",
      type: "video",
      description: "A comprehensive guide to AI tools",
      tags: ["ai", "content creation", "tutorial"]
    }, TEST_CONFIG);
    
    const hasRealPrediction = response.data && 
      response.data.predictedViews &&
      response.data.predictedViews > 0 &&
      !response.data.predictedViews.toString().includes('fallback') &&
      !response.data.predictedViews.toString().includes('mock');
    
    logTest('AI Generator - Predictive AI', hasRealPrediction,
      hasRealPrediction ? null : new Error('Response contains fallback/mock predictions'));
  } catch (error) {
    logTest('AI Generator - Predictive AI', false, error);
  }

  // Test 6: AI Generator - Classic Script
  try {
    console.log('🔍 Testing AI Generator - Classic Script...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-script`, {
      topic: "AI Tools for Content Creators",
      platform: "youtube",
      duration: "60 seconds"
    }, TEST_CONFIG);
    
    const hasRealScript = response.data && 
      response.data.script &&
      response.data.script.length > 200 &&
      !response.data.script.includes('fallback') &&
      !response.data.script.includes('mock');
    
    logTest('AI Generator - Classic Script', hasRealScript,
      hasRealScript ? null : new Error('Response contains fallback/mock script'));
  } catch (error) {
    logTest('AI Generator - Classic Script', false, error);
  }

  // Test 7: AI Generator - Ideas
  try {
    console.log('🔍 Testing AI Generator - Ideas...');
    const response = await axios.post(`${BASE_URL}/api/ai/content-ideas`, {
      niche: "tech tutorials",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealIdeas = response.data && 
      response.data.ideas &&
      response.data.ideas.length > 0 &&
      !response.data.ideas.some(idea => idea.includes('fallback') || idea.includes('mock'));
    
    logTest('AI Generator - Ideas', hasRealIdeas,
      hasRealIdeas ? null : new Error('Response contains fallback/mock ideas'));
  } catch (error) {
    logTest('AI Generator - Ideas', false, error);
  }

  // Test 8: Analytics - Predictive AI
  try {
    console.log('🔍 Testing Analytics - Predictive AI...');
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: "AI Tools for Content Creators - A comprehensive guide",
      platform: "youtube",
      audience: "content creators"
    }, TEST_CONFIG);
    
    const hasRealAnalytics = response.data && 
      response.data.result &&
      response.data.result.predictedViews &&
      response.data.result.predictedViews > 0 &&
      !response.data.result.predictedViews.toString().includes('fallback') &&
      !response.data.result.predictedViews.toString().includes('mock');
    
    logTest('Analytics - Predictive AI', hasRealAnalytics,
      hasRealAnalytics ? null : new Error('Response contains fallback/mock analytics'));
  } catch (error) {
    logTest('Analytics - Predictive AI', false, error);
  }

  // Test 9: Analytics - Competitor Intel
  try {
    console.log('🔍 Testing Analytics - Competitor Intel...');
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-competitors`, {
      niche: "tech tutorials",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealCompetitors = response.data && 
      response.data.result &&
      response.data.result.competitorProfiles &&
      response.data.result.competitorProfiles.length > 0 &&
      !response.data.result.competitorProfiles.some(profile => 
        profile.name.includes('fallback') || profile.name.includes('mock')
      );
    
    logTest('Analytics - Competitor Intel', hasRealCompetitors,
      hasRealCompetitors ? null : new Error('Response contains fallback/mock competitor data'));
  } catch (error) {
    logTest('Analytics - Competitor Intel', false, error);
  }

  // Test 10: Analytics - Monetization
  try {
    console.log('🔍 Testing Analytics - Monetization...');
    const response = await axios.post(`${BASE_URL}/api/analytics/generate-monetization`, {
      content: "tech tutorials",
      audience: "content creators",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealMonetization = response.data && 
      response.data.result &&
      response.data.result.revenueStreams &&
      response.data.result.revenueStreams.length > 0 &&
      !response.data.result.revenueStreams.some(stream => 
        stream.type.includes('fallback') || stream.type.includes('mock')
      );
    
    logTest('Analytics - Monetization', hasRealMonetization,
      hasRealMonetization ? null : new Error('Response contains fallback/mock monetization data'));
  } catch (error) {
    logTest('Analytics - Monetization', false, error);
  }

  // Test 11: Creator Studio - Text Generation
  try {
    console.log('🔍 Testing Creator Studio - Text Generation...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: "Write a blog post about AI in content creation",
      options: {
        maxTokens: 1000,
        temperature: 0.7
      }
    }, TEST_CONFIG);
    
    const hasRealText = response.data && 
      response.data.result &&
      response.data.result.length > 200 &&
      !response.data.result.includes('fallback') &&
      !response.data.result.includes('mock');
    
    logTest('Creator Studio - Text Generation', hasRealText,
      hasRealText ? null : new Error('Response contains fallback/mock text'));
  } catch (error) {
    logTest('Creator Studio - Text Generation', false, error);
  }

  // Test 12: Creator Studio - Structured Output
  try {
    console.log('🔍 Testing Creator Studio - Structured Output...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-structured`, {
      prompt: "Create a content plan for tech tutorials",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          schedule: { type: "string" }
        }
      }
    }, TEST_CONFIG);
    
    const hasRealStructured = response.data && 
      response.data.result &&
      response.data.result.title &&
      !response.data.result.title.includes('fallback') &&
      !response.data.result.title.includes('mock');
    
    logTest('Creator Studio - Structured Output', hasRealStructured,
      hasRealStructured ? null : new Error('Response contains fallback/mock structured data'));
  } catch (error) {
    logTest('Creator Studio - Structured Output', false, error);
  }

  // Test 13: Creator Studio - Code Generation
  try {
    console.log('🔍 Testing Creator Studio - Code Generation...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-code`, {
      description: "Create a function to generate content ideas",
      language: "javascript"
    }, TEST_CONFIG);
    
    const hasRealCode = response.data && 
      response.data.result &&
      response.data.result.code &&
      response.data.result.code.length > 50 &&
      !response.data.result.code.includes('fallback') &&
      !response.data.result.code.includes('mock');
    
    logTest('Creator Studio - Code Generation', hasRealCode,
      hasRealCode ? null : new Error('Response contains fallback/mock code'));
  } catch (error) {
    logTest('Creator Studio - Code Generation', false, error);
  }

  // Test 14: Creator Studio - Content Optimization
  try {
    console.log('🔍 Testing Creator Studio - Content Optimization...');
    const response = await axios.post(`${BASE_URL}/api/gemini/optimize-content`, {
      content: "AI tools are great for content creation",
      platform: "youtube",
      goals: ["engagement", "reach"]
    }, TEST_CONFIG);
    
    const hasRealOptimization = response.data && 
      response.data.result &&
      response.data.result.optimizedContent &&
      response.data.result.optimizedContent.length > 50 &&
      !response.data.result.optimizedContent.includes('Optimized version of: sample content') &&
      !response.data.result.optimizedContent.includes('sample content');
    
    logTest('Creator Studio - Content Optimization', hasRealOptimization,
      hasRealOptimization ? null : new Error('Response contains fallback/mock optimization'));
  } catch (error) {
    logTest('Creator Studio - Content Optimization', false, error);
  }

  // Test 15: Creator Studio - Document Analysis
  try {
    console.log('🔍 Testing Creator Studio - Document Analysis...');
    const response = await axios.post(`${BASE_URL}/api/gemini/analyze-document`, {
      text: "AI tools are revolutionizing content creation. They help creators produce better content faster.",
      analysisType: "all"
    }, TEST_CONFIG);
    
    const hasRealAnalysis = response.data && 
      response.data.result &&
      response.data.result.summary &&
      response.data.result.summary.length > 20 &&
      !response.data.result.summary.includes('fallback') &&
      !response.data.result.summary.includes('mock');
    
    logTest('Creator Studio - Document Analysis', hasRealAnalysis,
      hasRealAnalysis ? null : new Error('Response contains fallback/mock analysis'));
  } catch (error) {
    logTest('Creator Studio - Document Analysis', false, error);
  }

  // Test 16: Creator Studio - Search Grounded
  try {
    console.log('🔍 Testing Creator Studio - Search Grounded...');
    const response = await axios.post(`${BASE_URL}/api/gemini/search-grounded`, {
      query: "What are the latest AI tools for content creation?",
      context: "I'm a content creator looking for new tools"
    }, TEST_CONFIG);
    
    const hasRealSearch = response.data && 
      response.data.result &&
      response.data.result.response &&
      response.data.result.response.length > 50 &&
      !response.data.result.response.includes('Sample response to: sample query') &&
      !response.data.result.response.includes('sample query');
    
    logTest('Creator Studio - Search Grounded', hasRealSearch,
      hasRealSearch ? null : new Error('Response contains fallback/mock search results'));
  } catch (error) {
    logTest('Creator Studio - Search Grounded', false, error);
  }

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 REAL DATA INTEGRATION TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 ALL TESTS PASSED! Real data integration is working perfectly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the API configurations and ensure AI services are properly set up.');
  }
  
  console.log('\n💡 TIPS:');
  console.log('  - Ensure API keys are properly configured in environment variables');
  console.log('  - Check that AI services (OpenAI, Gemini) are accessible');
  console.log('  - Verify authentication tokens are valid');
  console.log('  - Monitor server logs for detailed error information');
}

// Run the test
testRealDataIntegration().catch(console.error);
