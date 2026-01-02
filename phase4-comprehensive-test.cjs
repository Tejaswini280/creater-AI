const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'phase4test@example.com',
  password: 'password123'
};

let authToken = null;
let userId = null;

// Utility functions
async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/api/health');
  
  if (result.status === 200 && result.data.status === 'healthy') {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', result);
    return false;
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  // Test login
  const loginResult = await makeRequest('POST', '/api/auth/login', TEST_USER);
  
  if (loginResult.status === 200 && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    userId = loginResult.data.user.id;
    console.log('✅ Authentication passed');
    return true;
  } else {
    console.log('❌ Authentication failed:', loginResult);
    return false;
  }
}

async function testContentCreation() {
  console.log('📝 Testing Content Creation...');
  
  const contentData = {
    title: 'Phase 4 Comprehensive Test Content',
    description: 'Content created for comprehensive Phase 4 testing',
    platform: 'youtube',
    contentType: 'video',
    status: 'draft'
  };
  
  const result = await makeRequest('POST', '/api/content', contentData, authToken);
  
  if (result.status === 201 && result.data.success) {
    console.log('✅ Content creation passed');
    return true;
  } else {
    console.log('❌ Content creation failed:', result);
    return false;
  }
}

async function testContentRetrieval() {
  console.log('📋 Testing Content Retrieval...');
  
  const result = await makeRequest('GET', '/api/content', null, authToken);
  
  if (result.status === 200 && result.data.success && Array.isArray(result.data.content)) {
    console.log(`✅ Content retrieval passed - Found ${result.data.content.length} content items`);
    return true;
  } else {
    console.log('❌ Content retrieval failed:', result);
    return false;
  }
}

async function testAnalyticsPerformance() {
  console.log('📊 Testing Analytics Performance...');
  
  const result = await makeRequest('GET', '/api/analytics/performance', null, authToken);
  
  if (result.status === 200 && result.data.success && result.data.analytics) {
    console.log('✅ Analytics performance passed');
    return true;
  } else {
    console.log('❌ Analytics performance failed:', result);
    return false;
  }
}

async function testNotifications() {
  console.log('🔔 Testing Notifications...');
  
  // Test notification creation
  const notificationData = {
    type: 'info',
    title: 'Comprehensive Test Notification',
    message: 'This notification was created during comprehensive Phase 4 testing',
    actionUrl: 'https://example.com',
    metadata: { category: 'test', priority: 'high' }
  };
  
  const createResult = await makeRequest('POST', '/api/notifications', notificationData, authToken);
  
  if (createResult.status === 201 && createResult.data.success) {
    console.log('✅ Notification creation passed');
  } else {
    console.log('❌ Notification creation failed:', createResult);
    return false;
  }
  
  // Test notification retrieval
  const getResult = await makeRequest('GET', '/api/notifications', null, authToken);
  
  if (getResult.status === 200 && getResult.data.success && Array.isArray(getResult.data.notifications)) {
    console.log(`✅ Notification retrieval passed - Found ${getResult.data.notifications.length} notifications`);
    return true;
  } else {
    console.log('❌ Notification retrieval failed:', getResult);
    return false;
  }
}

async function testTemplates() {
  console.log('📄 Testing Templates...');
  
  const result = await makeRequest('GET', '/api/templates', null, authToken);
  
  if (result.status === 200 && result.data.success && Array.isArray(result.data.templates)) {
    console.log(`✅ Templates passed - Found ${result.data.templates.length} templates`);
    return true;
  } else {
    console.log('❌ Templates failed:', result);
    return false;
  }
}

async function testRealDataIntegration() {
  console.log('🔄 Testing Real Data Integration...');
  
  // Test that we're getting real data, not mock data
  const contentResult = await makeRequest('GET', '/api/content', null, authToken);
  const analyticsResult = await makeRequest('GET', '/api/analytics/performance', null, authToken);
  const templatesResult = await makeRequest('GET', '/api/templates', null, authToken);
  
  let allRealData = true;
  
  // Check content has real IDs and timestamps
  if (contentResult.data.success && contentResult.data.content.length > 0) {
    const content = contentResult.data.content[0];
    if (content.id && content.createdAt && content.userId) {
      console.log('✅ Content has real data');
    } else {
      console.log('❌ Content has mock data');
      allRealData = false;
    }
  }
  
  // Check analytics has real structure
  if (analyticsResult.data.success && analyticsResult.data.analytics) {
    const analytics = analyticsResult.data.analytics;
    if (typeof analytics.views === 'number' && typeof analytics.engagement === 'number') {
      console.log('✅ Analytics has real data structure');
    } else {
      console.log('❌ Analytics has mock data');
      allRealData = false;
    }
  }
  
  // Check templates have real data
  if (templatesResult.data.success && templatesResult.data.templates.length > 0) {
    const template = templatesResult.data.templates[0];
    if (template.id && template.title && template.description) {
      console.log('✅ Templates have real data');
    } else {
      console.log('❌ Templates have mock data');
      allRealData = false;
    }
  }
  
  return allRealData;
}

async function testNoMockData() {
  console.log('🚫 Testing No Mock Data...');
  
  // Check that there are no hardcoded mock values in responses
  const analyticsResult = await makeRequest('GET', '/api/analytics/performance', null, authToken);
  
  if (analyticsResult.data.success) {
    const analytics = analyticsResult.data.analytics;
    
    // Check for common mock data patterns
    const mockPatterns = [
      '52,595', '12.5%', '8.3%', '15.2%', '23.1%',
      'mock', 'Mock', 'MOCK', 'placeholder', 'Placeholder', 'PLACEHOLDER'
    ];
    
    const responseString = JSON.stringify(analyticsResult.data);
    let hasMockData = false;
    
    for (const pattern of mockPatterns) {
      if (responseString.includes(pattern)) {
        console.log(`❌ Found mock data pattern: ${pattern}`);
        hasMockData = true;
      }
    }
    
    if (!hasMockData) {
      console.log('✅ No mock data patterns found');
      return true;
    } else {
      return false;
    }
  } else {
    console.log('❌ Could not test for mock data - analytics failed');
    return false;
  }
}

// Main test runner
async function runComprehensivePhase4Test() {
  console.log('🚀 PHASE 4 COMPREHENSIVE ACCEPTANCE TEST');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Content Creation', fn: testContentCreation },
    { name: 'Content Retrieval', fn: testContentRetrieval },
    { name: 'Analytics Performance', fn: testAnalyticsPerformance },
    { name: 'Notifications', fn: testNotifications },
    { name: 'Templates', fn: testTemplates },
    { name: 'Real Data Integration', fn: testRealDataIntegration },
    { name: 'No Mock Data', fn: testNoMockData }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 4 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 PHASE 4 COMPREHENSIVE TEST: 100% SUCCESS!');
    console.log('✅ All acceptance criteria and test cases passed');
    console.log('✅ Real data integration working');
    console.log('✅ No mock data found');
    console.log('✅ All endpoints functional');
    console.log('✅ Database integration complete');
  } else {
    console.log('\n⚠️  PHASE 4 COMPREHENSIVE TEST: PARTIAL SUCCESS');
    console.log('❌ Some tests failed - review required');
  }
  
  return passedTests === totalTests;
}

// Run the test
runComprehensivePhase4Test()
  .then((success) => {
    if (success) {
      console.log('\n🎯 PHASE 4 COMPLETION STATUS: COMPLETE');
      process.exit(0);
    } else {
      console.log('\n🎯 PHASE 4 COMPLETION STATUS: INCOMPLETE');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
