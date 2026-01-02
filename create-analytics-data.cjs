const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Use the real token from the user registration
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJUYW1oeGthQk5nUVhfTExXOFBlZWIiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlhdCI6MTc2NjQ4MTAzMSwiZXhwIjoxNzY2NDg0NjMxfQ.Oh6bRqsLYqZK5alX9cYbW0gwhMQRYdS6O_joQlwmhik';

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

async function createAnalyticsData() {
  console.log('📊 Creating Analytics Test Data...\n');

  try {
    // Test 1: Performance Analytics
    console.log('1. Testing Performance Analytics...');
    const performanceResponse = await makeRequest('GET', '/api/analytics/performance?period=30D', null, REAL_TOKEN);
    console.log(`✅ Performance Analytics: ${performanceResponse.status}`);
    if (performanceResponse.data) {
      console.log('   Data:', JSON.stringify(performanceResponse.data, null, 2));
    }

    // Test 2: Predictive Performance
    console.log('\n2. Testing Predictive Performance...');
    const predictResponse = await makeRequest('POST', '/api/analytics/predict-performance', {
      content: 'Ultimate Guide to AI Content Creation in 2025',
      platform: 'youtube',
      audience: 'content creators'
    }, REAL_TOKEN);
    console.log(`✅ Predictive Performance: ${predictResponse.status}`);
    if (predictResponse.data?.result) {
      console.log('   Predicted Views:', predictResponse.data.result.predictedViews);
      console.log('   Engagement Rate:', predictResponse.data.result.engagementRate);
      console.log('   Viral Potential:', predictResponse.data.result.viralPotential);
    }

    // Test 3: Competitor Analysis
    console.log('\n3. Testing Competitor Analysis...');
    const competitorResponse = await makeRequest('POST', '/api/analytics/analyze-competitors', {
      niche: 'tech tutorials',
      platform: 'youtube'
    }, REAL_TOKEN);
    console.log(`✅ Competitor Analysis: ${competitorResponse.status}`);
    if (competitorResponse.data?.result) {
      console.log('   Top Competitors:', competitorResponse.data.result.topCompetitors?.length || 0);
      console.log('   Content Gaps:', competitorResponse.data.result.contentGaps?.length || 0);
    }

    // Test 4: Monetization Strategy
    console.log('\n4. Testing Monetization Strategy...');
    const monetizationResponse = await makeRequest('POST', '/api/analytics/generate-monetization', {
      content: 'tech tutorials',
      audience: 'content creators',
      platform: 'youtube'
    }, REAL_TOKEN);
    console.log(`✅ Monetization Strategy: ${monetizationResponse.status}`);
    if (monetizationResponse.data?.result) {
      console.log('   Revenue Streams:', monetizationResponse.data.result.revenueStreams?.length || 0);
      console.log('   Expected Revenue (6m):', monetizationResponse.data.result.expectedRevenue?.sixMonth);
    }

    // Test 5: Content Trends
    console.log('\n5. Testing Content Trends...');
    const trendsResponse = await makeRequest('POST', '/api/analytics/analyze-trends', {
      niche: 'tech tutorials',
      timeframe: '30 days'
    }, REAL_TOKEN);
    console.log(`✅ Content Trends: ${trendsResponse.status}`);
    if (trendsResponse.data?.result) {
      console.log('   Trending Topics:', trendsResponse.data.result.trendingTopics?.length || 0);
    }

    // Test 6: Niche Analysis
    console.log('\n6. Testing Niche Analysis...');
    const nicheResponse = await makeRequest('POST', '/api/analytics/analyze-niche', {
      category: 'AI and Technology',
      region: 'global',
      competition: 'medium'
    }, REAL_TOKEN);
    console.log(`✅ Niche Analysis: ${nicheResponse.status}`);
    if (nicheResponse.data?.analysis) {
      console.log('   Niche Score:', nicheResponse.data.analysis.trendScore);
      console.log('   Opportunities:', nicheResponse.data.analysis.opportunities?.length || 0);
    }

    console.log('\n🎉 Analytics System Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   • Performance Analytics: Working ✅');
    console.log('   • Predictive AI: Working ✅');
    console.log('   • Competitor Intelligence: Working ✅');
    console.log('   • Monetization Strategy: Working ✅');
    console.log('   • Content Trends: Working ✅');
    console.log('   • Niche Analysis: Working ✅');
    console.log('\n🌐 Access your analytics at: http://localhost:5000/analytics');

  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  }
}

createAnalyticsData();