const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function generateFinalStatusReport() {
  console.log('🎯 FINAL REAL DATA INTEGRATION STATUS REPORT');
  console.log('=' .repeat(60));
  console.log('Testing all AI services to determine real vs fallback data usage\n');

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

  const results = [];

  // Test 1: Streaming AI
  try {
    console.log('1. Testing Streaming AI...');
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: "Create a YouTube script about AI tools for content creators",
      model: "gemini"
    }, TEST_CONFIG);
    
    const hasRealContent = response.data?.result?.content && 
      response.data.result.content.length > 100 &&
      !response.data.result.content.includes('fallback');
    
    results.push({ service: 'Streaming AI', status: hasRealContent ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealContent ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Streaming AI', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 2: Analytics Performance Prediction
  try {
    console.log('2. Testing Analytics Performance Prediction...');
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: "10 AI Tools That Will Change Content Creation Forever",
      platform: "youtube",
      audience: "content creators"
    }, TEST_CONFIG);
    
    const hasRealPredictions = response.data?.result?.predictedViews && 
      response.data.result.predictedViews > 0;
    
    results.push({ service: 'Analytics Performance', status: hasRealPredictions ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealPredictions ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Analytics Performance', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 3: AI Analytics Performance Prediction
  try {
    console.log('3. Testing AI Analytics Performance Prediction...');
    const response = await axios.post(`${BASE_URL}/api/ai/analytics/predict-performance`, {
      title: "10 AI Tools That Will Change Content Creation Forever",
      platform: "youtube",
      type: "video",
      description: "A comprehensive guide to AI tools for content creators",
      tags: ["ai", "content creation", "productivity", "tools"]
    }, TEST_CONFIG);
    
    const hasRealPredictions = response.data?.predictedViews && 
      response.data.predictedViews > 0;
    
    results.push({ service: 'AI Analytics Performance', status: hasRealPredictions ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealPredictions ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'AI Analytics Performance', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 4: Competitor Analysis
  try {
    console.log('4. Testing Competitor Analysis...');
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-competitors`, {
      niche: "tech tutorials",
      competitors: ["TechCrunch", "The Verge", "Wired"]
    }, TEST_CONFIG);
    
    const hasRealCompetitors = response.data?.result?.competitorProfiles && 
      response.data.result.competitorProfiles.length > 0;
    
    results.push({ service: 'Competitor Analysis', status: hasRealCompetitors ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealCompetitors ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Competitor Analysis', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 5: Monetization Strategy
  try {
    console.log('5. Testing Monetization Strategy...');
    const response = await axios.post(`${BASE_URL}/api/analytics/generate-monetization`, {
      content: "tech tutorials",
      audience: "content creators",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealMonetization = response.data?.result?.revenueStreams && 
      response.data.result.revenueStreams.length > 0;
    
    results.push({ service: 'Monetization Strategy', status: hasRealMonetization ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealMonetization ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Monetization Strategy', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 6: AI Agents
  try {
    console.log('6. Testing AI Agents...');
    const response = await axios.post(`${BASE_URL}/api/ai/agents/content-pipeline`, {
      niche: "technology",
      platforms: ["youtube", "tiktok"],
      contentTypes: ["tutorial", "review"],
      schedule: "daily"
    }, TEST_CONFIG);
    
    const hasRealAgent = response.data?.agentId && response.data?.status === "started";
    
    results.push({ service: 'AI Agents', status: hasRealAgent ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealAgent ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'AI Agents', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 7: Media AI - Thumbnail Generation
  try {
    console.log('7. Testing Media AI - Thumbnail Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: "AI tools for content creators - modern, vibrant, professional",
      style: "vibrant",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealThumbnail = response.data?.result?.imageUrl && 
      response.data.result.imageUrl.includes('http') &&
      !response.data.result.imageUrl.includes('fallback');
    
    results.push({ service: 'Media AI - Thumbnail', status: hasRealThumbnail ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealThumbnail ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    if (error.response?.data?.error?.includes('Billing hard limit')) {
      results.push({ service: 'Media AI - Thumbnail', status: '⚠️ BILLING LIMIT' });
      console.log('   ⚠️ BILLING LIMIT (API key reached limit)');
    } else {
      results.push({ service: 'Media AI - Thumbnail', status: '❌ ERROR' });
      console.log('   ❌ ERROR');
    }
  }

  // Test 8: Classic Scripts
  try {
    console.log('8. Testing Classic Scripts...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-script`, {
      topic: "AI tools for content creators",
      platform: "youtube",
      style: "educational",
      duration: "10 minutes"
    }, TEST_CONFIG);
    
    const hasRealScript = response.data?.script && 
      response.data.script.length > 200 &&
      !response.data.script.includes('fallback');
    
    results.push({ service: 'Classic Scripts', status: hasRealScript ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealScript ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Classic Scripts', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Test 9: Ideas Generation
  try {
    console.log('9. Testing Ideas Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-ideas`, {
      niche: "technology",
      platform: "youtube",
      count: 5,
      style: "viral"
    }, TEST_CONFIG);
    
    const hasRealIdeas = response.data?.ideas && 
      response.data.ideas.length > 0 &&
      response.data.ideas.every(idea => idea && idea.length > 10) &&
      !response.data.ideas.some(idea => idea.includes('technology Tips Everyone Should Know'));
    
    results.push({ service: 'Ideas Generation', status: hasRealIdeas ? '✅ REAL DATA' : '❌ FALLBACK DATA' });
    console.log(`   ${hasRealIdeas ? '✅ REAL DATA' : '❌ FALLBACK DATA'}`);
  } catch (error) {
    results.push({ service: 'Ideas Generation', status: '❌ ERROR' });
    console.log('   ❌ ERROR');
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL STATUS SUMMARY');
  console.log('=' .repeat(60));

  const realDataCount = results.filter(r => r.status === '✅ REAL DATA').length;
  const fallbackCount = results.filter(r => r.status === '❌ FALLBACK DATA').length;
  const errorCount = results.filter(r => r.status === '❌ ERROR').length;
  const billingLimitCount = results.filter(r => r.status === '⚠️ BILLING LIMIT').length;

  console.log(`✅ REAL DATA: ${realDataCount}/9 services`);
  console.log(`❌ FALLBACK DATA: ${fallbackCount}/9 services`);
  console.log(`❌ ERRORS: ${errorCount}/9 services`);
  console.log(`⚠️ BILLING LIMIT: ${billingLimitCount}/9 services`);

  console.log('\n📋 DETAILED BREAKDOWN:');
  results.forEach(result => {
    console.log(`   ${result.service}: ${result.status}`);
  });

  console.log('\n🎯 RECOMMENDATIONS:');
  if (realDataCount >= 6) {
    console.log('✅ EXCELLENT! Most services are using real AI data.');
  } else if (realDataCount >= 4) {
    console.log('⚠️ GOOD! Many services are using real AI data, but some need fixing.');
  } else {
    console.log('❌ NEEDS WORK! Most services are still using fallback data.');
  }

  if (billingLimitCount > 0) {
    console.log('⚠️ BILLING LIMIT: Some services hit API billing limits - consider using a different API key.');
  }

  if (fallbackCount > 0) {
    console.log('🔧 FALLBACK DATA: Some services need to be configured to use real AI APIs.');
  }

  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Fix services using fallback data');
  console.log('2. Address billing limit issues');
  console.log('3. Test all services with real user scenarios');
  console.log('4. Monitor API usage and costs');
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

generateFinalStatusReport().catch(console.error);
