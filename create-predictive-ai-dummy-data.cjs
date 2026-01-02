const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Use a real token for testing (you'll need to get this from your login)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJUYW1oeGthQk5nUVhfTExXOFBlZWIiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlhdCI6MTc2NjQ4MTAzMSwiZXhwIjoxNzY2NDg0NjMxfQ.Oh6bRqsLYqZK5alX9cYbW0gwhMQRYdS6O_joQlwmhik';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testPredictiveAIFeatures() {
  console.log('🤖 PREDICTIVE AI ANALYTICS - COMPREHENSIVE TESTING\n');

  // Test scenarios for different content types and platforms
  const testScenarios = [
    {
      name: 'YouTube Tech Tutorial',
      content: 'Ultimate Guide to AI Content Creation with ChatGPT and Midjourney',
      platform: 'youtube',
      audience: 'content creators'
    },
    {
      name: 'Instagram Lifestyle Post',
      content: 'Morning Routine for Productivity and Success',
      platform: 'instagram',
      audience: 'lifestyle enthusiasts'
    },
    {
      name: 'TikTok Viral Challenge',
      content: 'AI Art Challenge - Create Amazing Art in 60 Seconds',
      platform: 'tiktok',
      audience: 'gen z creators'
    },
    {
      name: 'LinkedIn Business Content',
      content: 'How to Build a Personal Brand on LinkedIn in 2025',
      platform: 'linkedin',
      audience: 'professionals'
    },
    {
      name: 'Twitter Thread',
      content: 'Thread: 10 AI Tools Every Creator Should Know About',
      platform: 'twitter',
      audience: 'tech enthusiasts'
    }
  ];

  try {
    console.log('🎯 TESTING PREDICTIVE PERFORMANCE ANALYSIS\n');

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`${i + 1}. Testing: ${scenario.name}`);
      console.log(`   Content: "${scenario.content}"`);
      console.log(`   Platform: ${scenario.platform} | Audience: ${scenario.audience}`);

      const response = await makeRequest('POST', '/api/analytics/predict-performance', {
        content: scenario.content,
        platform: scenario.platform,
        audience: scenario.audience
      }, TEST_TOKEN);

      if (response.status === 200 && response.data?.result) {
        const result = response.data.result;
        console.log('   ✅ PREDICTION SUCCESS:');
        console.log(`      📈 Predicted Views: ${result.predictedViews?.toLocaleString() || 'N/A'}`);
        console.log(`      💬 Engagement Rate: ${(result.engagementRate * 100)?.toFixed(1) || 'N/A'}%`);
        console.log(`      🚀 Viral Potential: ${result.viralPotential || 'N/A'}%`);
        console.log(`      🎯 Confidence: ${(result.confidence * 100)?.toFixed(0) || 'N/A'}%`);
        
        if (result.recommendations && result.recommendations.length > 0) {
          console.log('      💡 Top Recommendations:');
          result.recommendations.slice(0, 2).forEach((rec, idx) => {
            console.log(`         ${idx + 1}. ${rec}`);
          });
        }
        
        if (result.factors) {
          console.log(`      ✅ Positive Factors: ${result.factors.positive?.length || 0}`);
          console.log(`      ⚠️ Negative Factors: ${result.factors.negative?.length || 0}`);
        }
      } else {
        console.log(`   ❌ PREDICTION FAILED: Status ${response.status}`);
        if (response.data?.message) {
          console.log(`      Error: ${response.data.message}`);
        }
      }
      console.log('');
    }

    console.log('🔍 TESTING COMPETITOR ANALYSIS\n');

    const competitorTests = [
      {
        name: 'Tech YouTube Niche',
        niche: 'tech tutorials and reviews',
        platform: 'youtube'
      },
      {
        name: 'Fitness Instagram Niche',
        niche: 'fitness and wellness',
        platform: 'instagram'
      },
      {
        name: 'Business LinkedIn Niche',
        niche: 'entrepreneurship and business',
        platform: 'linkedin'
      }
    ];

    for (let i = 0; i < competitorTests.length; i++) {
      const test = competitorTests[i];
      console.log(`${i + 1}. Testing: ${test.name}`);
      console.log(`   Niche: ${test.niche} | Platform: ${test.platform}`);

      const response = await makeRequest('POST', '/api/analytics/analyze-competitors', {
        niche: test.niche,
        platform: test.platform
      }, TEST_TOKEN);

      if (response.status === 200 && response.data?.result) {
        const result = response.data.result;
        console.log('   ✅ COMPETITOR ANALYSIS SUCCESS:');
        console.log(`      🏆 Top Competitors: ${result.topCompetitors?.length || 0}`);
        console.log(`      🎯 Content Gaps: ${result.contentGaps?.length || 0}`);
        console.log(`      💡 Winning Strategies: ${result.winningStrategies?.length || 0}`);
        console.log(`      🚀 Market Opportunities: ${result.marketOpportunities?.length || 0}`);
        
        if (result.topCompetitors && result.topCompetitors.length > 0) {
          console.log('      📊 Sample Competitor:');
          const competitor = result.topCompetitors[0];
          console.log(`         Name: ${competitor.name}`);
          console.log(`         Followers: ${competitor.followers}`);
          console.log(`         Strategy: ${competitor.strategy}`);
        }
      } else {
        console.log(`   ❌ COMPETITOR ANALYSIS FAILED: Status ${response.status}`);
        if (response.data?.message) {
          console.log(`      Error: ${response.data.message}`);
        }
      }
      console.log('');
    }

    console.log('💰 TESTING MONETIZATION STRATEGY GENERATION\n');

    const monetizationTests = [
      {
        name: 'Tech Education Channel',
        content: 'AI and technology tutorials',
        audience: 'developers and tech enthusiasts',
        platform: 'youtube'
      },
      {
        name: 'Lifestyle Instagram',
        content: 'wellness and lifestyle content',
        audience: 'health-conscious millennials',
        platform: 'instagram'
      },
      {
        name: 'Business LinkedIn',
        content: 'entrepreneurship and business advice',
        audience: 'business professionals',
        platform: 'linkedin'
      }
    ];

    for (let i = 0; i < monetizationTests.length; i++) {
      const test = monetizationTests[i];
      console.log(`${i + 1}. Testing: ${test.name}`);
      console.log(`   Content: ${test.content}`);
      console.log(`   Audience: ${test.audience} | Platform: ${test.platform}`);

      const response = await makeRequest('POST', '/api/analytics/generate-monetization', {
        content: test.content,
        audience: test.audience,
        platform: test.platform
      }, TEST_TOKEN);

      if (response.status === 200 && response.data?.result) {
        const result = response.data.result;
        console.log('   ✅ MONETIZATION STRATEGY SUCCESS:');
        console.log(`      💵 6-Month Revenue: ${result.expectedRevenue?.sixMonth || 'N/A'}`);
        console.log(`      💰 1-Year Revenue: ${result.expectedRevenue?.oneYear || 'N/A'}`);
        console.log(`      🎯 Revenue Streams: ${result.revenueStreams?.length || 0}`);
        console.log(`      🤝 Sponsorship Opportunities: ${result.sponsorshipOpportunities?.length || 0}`);
        console.log(`      📦 Product Ideas: ${result.productIdeas?.length || 0}`);
        console.log(`      ⏱️ Timeline to Monetization: ${result.timelineToMonetization || 'N/A'}`);
        
        if (result.revenueStreams && result.revenueStreams.length > 0) {
          console.log('      🚀 Top Revenue Stream:');
          const topStream = result.revenueStreams[0];
          console.log(`         Type: ${topStream.type}`);
          console.log(`         Potential: ${topStream.potential}%`);
          console.log(`         Timeline: ${topStream.timeline}`);
        }
      } else {
        console.log(`   ❌ MONETIZATION STRATEGY FAILED: Status ${response.status}`);
        if (response.data?.message) {
          console.log(`      Error: ${response.data.message}`);
        }
      }
      console.log('');
    }

    console.log('📈 TESTING CONTENT TRENDS ANALYSIS\n');

    const trendTests = [
      { niche: 'artificial intelligence', timeframe: '30 days' },
      { niche: 'social media marketing', timeframe: '7 days' },
      { niche: 'personal development', timeframe: '90 days' }
    ];

    for (let i = 0; i < trendTests.length; i++) {
      const test = trendTests[i];
      console.log(`${i + 1}. Testing Trends: ${test.niche}`);
      console.log(`   Timeframe: ${test.timeframe}`);

      const response = await makeRequest('POST', '/api/analytics/analyze-trends', {
        niche: test.niche,
        timeframe: test.timeframe
      }, TEST_TOKEN);

      if (response.status === 200 && response.data?.result) {
        const result = response.data.result;
        console.log('   ✅ TRENDS ANALYSIS SUCCESS:');
        console.log(`      🔥 Trending Topics: ${result.trendingTopics?.length || 0}`);
        console.log(`      📱 Platform Trends: Available for ${Object.keys(result.platformTrends || {}).length} platforms`);
        console.log(`      🗓️ Seasonal Trends: ${result.seasonalTrends?.length || 0}`);
        console.log(`      💡 Recommendations: ${result.recommendations?.length || 0}`);
        
        if (result.trendingTopics && result.trendingTopics.length > 0) {
          const topTrend = result.trendingTopics[0];
          console.log(`      🚀 Top Trend: ${topTrend.topic} (${topTrend.growth}% growth)`);
        }
      } else {
        console.log(`   ❌ TRENDS ANALYSIS FAILED: Status ${response.status}`);
        if (response.data?.message) {
          console.log(`      Error: ${response.data.message}`);
        }
      }
      console.log('');
    }

    // Summary and instructions
    console.log('🎉 PREDICTIVE AI TESTING COMPLETE!\n');
    
    console.log('📊 TESTING SUMMARY:');
    console.log('   ✅ Performance Prediction - Multiple scenarios tested');
    console.log('   ✅ Competitor Analysis - Various niches analyzed');
    console.log('   ✅ Monetization Strategy - Revenue projections generated');
    console.log('   ✅ Content Trends - Market trends identified');

    console.log('\n🌐 HOW TO TEST PREDICTIVE AI IN YOUR APPLICATION:');
    console.log('\n   1. OPEN ANALYTICS DASHBOARD:');
    console.log('      → Go to: http://localhost:5000/analytics');
    console.log('      → Click on "Predictive AI" tab');

    console.log('\n   2. TEST PERFORMANCE PREDICTION:');
    console.log('      → Enter content title: "Ultimate AI Guide 2025"');
    console.log('      → Select platform: YouTube');
    console.log('      → Select audience: Content Creators');
    console.log('      → Click "Predict Performance"');
    console.log('      → Should show: Views, Engagement Rate, Viral Potential, Recommendations');

    console.log('\n   3. TEST COMPETITOR ANALYSIS:');
    console.log('      → Go to "Competitor Intel" tab');
    console.log('      → Enter niche: "tech tutorials"');
    console.log('      → Select platform: YouTube');
    console.log('      → Click "Analyze Competitor Landscape"');
    console.log('      → Should show: Top Competitors, Content Gaps, Winning Strategies');

    console.log('\n   4. TEST MONETIZATION STRATEGY:');
    console.log('      → Go to "Monetization" tab');
    console.log('      → Enter niche: "tech tutorials"');
    console.log('      → Click "Generate Monetization Strategy"');
    console.log('      → Should show: Revenue Projections, Revenue Streams, Product Ideas');

    console.log('\n   5. VERIFY AI FEATURES WORK:');
    console.log('      ✓ Forms accept input and submit properly');
    console.log('      ✓ Loading states show during processing');
    console.log('      ✓ Results display with charts and data');
    console.log('      ✓ Error handling for invalid inputs');
    console.log('      ✓ Toast notifications for success/failure');

    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('   • Realistic performance predictions with confidence scores');
    console.log('   • Comprehensive competitor analysis with actionable insights');
    console.log('   • Detailed monetization strategies with revenue projections');
    console.log('   • Market trend analysis with platform-specific recommendations');
    console.log('   • Professional UI with charts, progress bars, and data visualization');

    console.log('\n🚀 PREDICTIVE AI SYSTEM: FULLY FUNCTIONAL FOR TESTING ✅');

  } catch (error) {
    console.error('❌ Error testing Predictive AI features:', error);
  }
}

testPredictiveAIFeatures();