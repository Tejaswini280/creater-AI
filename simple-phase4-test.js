import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

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

async function testPhase4Issues() {
  console.log('🔍 Testing Phase 4 Issues');
  console.log('=' .repeat(50));

  // Test 1: Health check
  console.log('\n1. Testing health check...');
  const healthResponse = await makeRequest('GET', '/api/health');
  console.log(`Health: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);

  // Test 2: Register test user
  console.log('\n2. Testing user registration...');
  const testUser = {
    email: 'phase4test@example.com',
    password: 'password123',
    firstName: 'Phase4',
    lastName: 'Test'
  };
  
  const registerResponse = await makeRequest('POST', '/api/auth/register', testUser);
  console.log(`Register: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);

  let authToken = null;
  if (registerResponse.status === 201 || registerResponse.status === 200) {
    authToken = registerResponse.data.accessToken;
  } else {
    // Try login
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log(`Login: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    if (loginResponse.status === 200) {
      authToken = loginResponse.data.accessToken;
    }
  }

  if (!authToken) {
    console.log('❌ Failed to get auth token');
    return;
  }

  console.log('✅ Got auth token');

  // Test 3: Create multiple content pieces to generate data
  console.log('\n3. Creating test content...');
  const contentPieces = [
    {
      title: 'Phase 4 Test Content 1',
      description: 'First test content for Phase 4',
      platform: 'youtube',
      contentType: 'video',
      status: 'published'
    },
    {
      title: 'Phase 4 Test Content 2',
      description: 'Second test content for Phase 4',
      platform: 'instagram',
      contentType: 'image',
      status: 'published'
    },
    {
      title: 'Phase 4 Test Content 3',
      description: 'Third test content for Phase 4',
      platform: 'tiktok',
      contentType: 'video',
      status: 'draft'
    }
  ];

  for (let i = 0; i < contentPieces.length; i++) {
    const createContentResponse = await makeRequest('POST', '/api/content/create', contentPieces[i], authToken);
    console.log(`Create Content ${i + 1}: ${createContentResponse.status} - ${JSON.stringify(createContentResponse.data)}`);
  }

  // Test 4: Analytics Performance
  console.log('\n4. Testing analytics performance...');
  const analyticsResponse = await makeRequest('GET', '/api/analytics/performance?period=7D', null, authToken);
  console.log(`Analytics: ${analyticsResponse.status} - ${JSON.stringify(analyticsResponse.data)}`);

  // Test 5: Notifications
  console.log('\n5. Testing notifications...');
  const notificationsResponse = await makeRequest('GET', '/api/notifications', null, authToken);
  console.log(`Notifications: ${notificationsResponse.status} - ${JSON.stringify(notificationsResponse.data)}`);

  // Test 6: Content
  console.log('\n6. Testing content...');
  const contentResponse = await makeRequest('GET', '/api/content', null, authToken);
  console.log(`Content: ${contentResponse.status} - ${JSON.stringify(contentResponse.data)}`);

  // Test 7: Templates
  console.log('\n7. Testing templates...');
  const templatesResponse = await makeRequest('GET', '/api/templates', null, authToken);
  console.log(`Templates: ${templatesResponse.status} - ${JSON.stringify(templatesResponse.data)}`);

  // Test 8: Create notification manually
  console.log('\n8. Testing notification creation...');
  const notificationData = {
    type: 'info',
    title: 'Phase 4 Test Notification',
    message: 'This is a test notification for Phase 4',
    isRead: false,
    actionUrl: 'https://example.com',
    metadata: {
      priority: 'medium',
      category: 'test'
    }
  };
  
  // Try to create notification through API if endpoint exists
  const createNotificationResponse = await makeRequest('POST', '/api/notifications', notificationData, authToken);
  console.log(`Create Notification: ${createNotificationResponse.status} - ${JSON.stringify(createNotificationResponse.data)}`);

  // Test 9: Check notifications again
  console.log('\n9. Testing notifications after creation...');
  const notificationsResponse2 = await makeRequest('GET', '/api/notifications', null, authToken);
  console.log(`Notifications (after creation): ${notificationsResponse2.status} - ${JSON.stringify(notificationsResponse2.data)}`);

  console.log('\n' + '=' .repeat(50));
  console.log('📊 PHASE 4 ISSUE ANALYSIS COMPLETE');
  
  // Summary
  console.log('\n📋 SUMMARY:');
  console.log(`- Analytics working: ${analyticsResponse.status === 200 ? '✅' : '❌'}`);
  console.log(`- Notifications working: ${notificationsResponse.status === 200 ? '✅' : '❌'}`);
  console.log(`- Content working: ${contentResponse.status === 200 ? '✅' : '❌'}`);
  console.log(`- Templates working: ${templatesResponse.status === 200 ? '✅' : '❌'}`);
  console.log(`- Content creation working: ${contentResponse.data?.content?.length > 0 ? '✅' : '❌'}`);
}

testPhase4Issues().catch(console.error);
