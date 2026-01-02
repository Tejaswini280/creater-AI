#!/usr/bin/env node

/**
 * Real Data Integration Verification Test
 * Tests all AI services and data endpoints to ensure real data is being used
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // We'll need a real token for authenticated endpoints
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
    }
  }
  testResults.details.push({ name, passed, error });
}

async function testRealDataIntegration() {
  console.log('🚀 Testing Real Data Integration for AI Services...\n');

  // Test 1: Streaming AI - Real-time Script Generation
  try {
    console.log('🔍 Testing Streaming AI - Real-time Script Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/streaming-generate`, {
      prompt: "Create a YouTube script about AI tools for content creators",
      model: "gemini",
      options: {
        temperature: 0.7,
        maxTokens: 500,
        streamSpeed: "normal"
      }
    }, TEST_CONFIG);
    
    const hasRealContent = response.data && 
      response.data.result &&
      response.data.result.content &&
      response.data.result.content.length > 100 &&
      !response.data.result.content.includes('fallback') &&
      !response.data.result.content.includes('mock') &&
      !response.data.result.content.includes('sample');
    
    logTest('Streaming AI - Real-time Script Generation', hasRealContent,
      hasRealContent ? null : new Error('Response contains fallback/mock content'));
  } catch (error) {
    logTest('Streaming AI - Real-time Script Generation', false, error);
  }

  // Test 2: AI Analytics - Performance Prediction
  try {
    console.log('🔍 Testing AI Analytics - Performance Prediction...');
    const response = await axios.post(`${BASE_URL}/api/ai/analytics/predict-performance`, {
      title: "10 AI Tools That Will Change Content Creation Forever",
      platform: "youtube",
      type: "video",
      description: "A comprehensive guide to AI tools for content creators",
      tags: ["ai", "content creation", "productivity", "tools"]
    }, TEST_CONFIG);
    
    const hasRealPredictions = response.data && 
      response.data.predictedViews &&
      response.data.predictedViews > 0 &&
      response.data.predictedEngagement &&
      response.data.predictedEngagement > 0 &&
      response.data.optimizationSuggestions &&
      response.data.optimizationSuggestions.length > 0;
    
    logTest('AI Analytics - Performance Prediction', hasRealPredictions,
      hasRealPredictions ? null : new Error('Response contains fallback/mock predictions'));
  } catch (error) {
    logTest('AI Analytics - Performance Prediction', false, error);
  }

  // Test 3: AI Analytics - Competitor Analysis
  try {
    console.log('🔍 Testing AI Analytics - Competitor Analysis...');
    const response = await axios.get(`${BASE_URL}/api/ai/analytics/competitor-analysis/tech%20tutorials/youtube`, TEST_CONFIG);
    
    const hasRealCompetitors = response.data && 
      response.data.topCompetitors &&
      response.data.topCompetitors.length > 0 &&
      response.data.contentGaps &&
      response.data.contentGaps.length > 0 &&
      response.data.winningStrategies &&
      response.data.winningStrategies.length > 0;
    
    logTest('AI Analytics - Competitor Analysis', hasRealCompetitors,
      hasRealCompetitors ? null : new Error('Response contains fallback/mock competitor data'));
  } catch (error) {
    logTest('AI Analytics - Competitor Analysis', false, error);
  }

  // Test 4: Analytics - Performance Prediction
  try {
    console.log('🔍 Testing Analytics - Performance Prediction...');
    const response = await axios.post(`${BASE_URL}/api/analytics/predict-performance`, {
      content: "10 AI Tools That Will Change Content Creation Forever",
      platform: "youtube",
      audience: "content creators"
    }, TEST_CONFIG);
    
    const hasRealAnalytics = response.data && 
      response.data.result &&
      response.data.result.predictedViews &&
      response.data.result.engagementRate &&
      response.data.result.recommendations &&
      response.data.result.recommendations.length > 0;
    
    logTest('Analytics - Performance Prediction', hasRealAnalytics,
      hasRealAnalytics ? null : new Error('Response contains fallback/mock analytics'));
  } catch (error) {
    logTest('Analytics - Performance Prediction', false, error);
  }

  // Test 5: Analytics - Competitor Analysis
  try {
    console.log('🔍 Testing Analytics - Competitor Analysis...');
    const response = await axios.post(`${BASE_URL}/api/analytics/analyze-competitors`, {
      niche: "tech tutorials",
      competitors: ["TechCrunch", "The Verge", "Wired"]
    }, TEST_CONFIG);
    
    const hasRealCompetitorAnalysis = response.data && 
      response.data.result &&
      response.data.result.competitorProfiles &&
      response.data.result.competitorProfiles.length > 0 &&
      response.data.result.marketAnalysis &&
      response.data.result.recommendations;
    
    logTest('Analytics - Competitor Analysis', hasRealCompetitorAnalysis,
      hasRealCompetitorAnalysis ? null : new Error('Response contains fallback/mock competitor analysis'));
  } catch (error) {
    logTest('Analytics - Competitor Analysis', false, error);
  }

  // Test 6: Analytics - Monetization Strategy
  try {
    console.log('🔍 Testing Analytics - Monetization Strategy...');
    const response = await axios.post(`${BASE_URL}/api/analytics/generate-monetization`, {
      content: "tech tutorials",
      audience: "content creators",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealMonetization = response.data && 
      response.data.result &&
      response.data.result.revenueStreams &&
      response.data.result.revenueStreams.length > 0 &&
      response.data.result.expectedRevenue &&
      response.data.result.growthPlan;
    
    logTest('Analytics - Monetization Strategy', hasRealMonetization,
      hasRealMonetization ? null : new Error('Response contains fallback/mock monetization data'));
  } catch (error) {
    logTest('Analytics - Monetization Strategy', false, error);
  }

  // Test 7: AI Agents - Content Pipeline
  try {
    console.log('🔍 Testing AI Agents - Content Pipeline...');
    const response = await axios.post(`${BASE_URL}/api/ai/agents/create`, {
      name: "Tech Content Pipeline",
      config: {
        niche: "technology",
        platforms: ["youtube", "tiktok"],
        contentTypes: ["tutorial", "review"],
        schedule: "daily"
      }
    }, TEST_CONFIG);
    
    const hasRealAgent = response.data && 
      response.data.agentId &&
      response.data.status === "created";
    
    logTest('AI Agents - Content Pipeline', hasRealAgent,
      hasRealAgent ? null : new Error('Response contains fallback/mock agent data'));
  } catch (error) {
    logTest('AI Agents - Content Pipeline', false, error);
  }

  // Test 8: Media AI - Thumbnail Generation
  try {
    console.log('🔍 Testing Media AI - Thumbnail Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/media/generate-thumbnail`, {
      prompt: "AI tools for content creators - modern, vibrant, professional",
      style: "vibrant",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealThumbnail = response.data && 
      response.data.imageUrl &&
      response.data.imageUrl.includes('http') &&
      !response.data.imageUrl.includes('fallback') &&
      !response.data.imageUrl.includes('mock');
    
    logTest('Media AI - Thumbnail Generation', hasRealThumbnail,
      hasRealThumbnail ? null : new Error('Response contains fallback/mock thumbnail'));
  } catch (error) {
    logTest('Media AI - Thumbnail Generation', false, error);
  }

  // Test 9: Media AI - Voiceover Generation
  try {
    console.log('🔍 Testing Media AI - Voiceover Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/media/generate-voiceover`, {
      text: "Welcome to our comprehensive guide on AI tools for content creators.",
      voice: "alloy",
      platform: "youtube"
    }, TEST_CONFIG);
    
    const hasRealVoiceover = response.data && 
      response.data.audioUrl &&
      response.data.audioUrl.includes('http') &&
      !response.data.audioUrl.includes('fallback') &&
      !response.data.audioUrl.includes('mock');
    
    logTest('Media AI - Voiceover Generation', hasRealVoiceover,
      hasRealVoiceover ? null : new Error('Response contains fallback/mock voiceover'));
  } catch (error) {
    logTest('Media AI - Voiceover Generation', false, error);
  }

  // Test 10: Classic Scripts - Content Generation
  try {
    console.log('🔍 Testing Classic Scripts - Content Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-script`, {
      topic: "AI tools for content creators",
      platform: "youtube",
      style: "educational",
      duration: "10 minutes"
    }, TEST_CONFIG);
    
    const hasRealScript = response.data && 
      response.data.script &&
      response.data.script.length > 200 &&
      !response.data.script.includes('fallback') &&
      !response.data.script.includes('mock') &&
      !response.data.script.includes('sample');
    
    logTest('Classic Scripts - Content Generation', hasRealScript,
      hasRealScript ? null : new Error('Response contains fallback/mock script'));
  } catch (error) {
    logTest('Classic Scripts - Content Generation', false, error);
  }

  // Test 11: Ideas - Content Ideas Generation
  try {
    console.log('🔍 Testing Ideas - Content Ideas Generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-ideas`, {
      niche: "technology",
      platform: "youtube",
      count: 5,
      style: "viral"
    }, TEST_CONFIG);
    
    const hasRealIdeas = response.data && 
      response.data.ideas &&
      response.data.ideas.length > 0 &&
      response.data.ideas.every(idea => 
        idea.title && 
        idea.title.length > 10 &&
        !idea.title.includes('fallback') &&
        !idea.title.includes('mock')
      );
    
    logTest('Ideas - Content Ideas Generation', hasRealIdeas,
      hasRealIdeas ? null : new Error('Response contains fallback/mock ideas'));
  } catch (error) {
    logTest('Ideas - Content Ideas Generation', false, error);
  }

  // Test 12: Creator Studio - Text Generation
  try {
    console.log('🔍 Testing Creator Studio - Text Generation...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate`, {
      prompt: "Write a compelling introduction for a video about AI tools",
      model: "gemini-2.0-flash-exp",
      options: {
        temperature: 0.7,
        maxTokens: 300
      }
    }, TEST_CONFIG);
    
    const hasRealGeminiText = response.data && 
      response.data.content &&
      response.data.content.length > 50 &&
      !response.data.content.includes('fallback') &&
      !response.data.content.includes('mock') &&
      !response.data.content.includes('sample');
    
    logTest('Creator Studio - Text Generation', hasRealGeminiText,
      hasRealGeminiText ? null : new Error('Response contains fallback/mock Gemini text'));
  } catch (error) {
    logTest('Creator Studio - Text Generation', false, error);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`- ${test.name}: ${test.error?.message || 'Unknown error'}`);
      });
  }

  console.log('\n🎯 Real Data Integration Status:');
  if (testResults.passed === testResults.total) {
    console.log('✅ ALL SERVICES ARE USING REAL DATA!');
  } else if (testResults.passed > testResults.total * 0.8) {
    console.log('⚠️ MOST SERVICES ARE USING REAL DATA, BUT SOME FALLBACKS EXIST');
  } else {
    console.log('❌ MANY SERVICES ARE STILL USING FALLBACK/MOCK DATA');
  }
}

// Run the test
testRealDataIntegration().catch(console.error);
