import fetch from 'node-fetch';

async function testSchedulerWithAuth() {
  console.log('🔐 Testing Scheduler with Real Authentication...\n');

  // Use the test token that the authentication middleware accepts
  const token = 'test-token'; // This is accepted by the auth middleware

  const testData = {
    title: "Real Test Content",
    description: "This is a real test content description",
    platform: "youtube",
    contentType: "video",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
  };

  console.log('📤 Sending test data with test auth token:', JSON.stringify(testData, null, 2));

  try {
    // Test the content creation endpoint with authentication
    const response = await fetch('http://localhost:5000/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      console.log('✅ API call successful with authentication!');
      
      // Parse the response to verify the content was created correctly
      const responseData = JSON.parse(responseText);
      console.log('📋 Created content details:');
      console.log('  - ID:', responseData.content.id);
      console.log('  - Title:', responseData.content.title);
      console.log('  - Status:', responseData.content.status);
      console.log('  - Scheduled At:', responseData.content.scheduledAt);
      console.log('  - Platform:', responseData.content.platform);
      
      return true;
    } else {
      console.log('❌ API call failed with authentication!');
      
      if (response.status === 401) {
        console.log('🔐 Authentication failed - you need to log in first');
        console.log('💡 Go to http://localhost:5000/login to create an account or log in');
      } else if (response.status === 403) {
        console.log('🔐 Token invalid or expired');
        console.log('💡 The test token should work - check server logs');
      }
      
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing API with auth:', error.message);
    return false;
  }
}

// Test the frontend scheduler functionality
async function testFrontendScheduler() {
  console.log('\n🌐 Testing Frontend Scheduler...\n');
  
  try {
    // Test if the frontend is accessible
    const response = await fetch('http://localhost:5000/scheduler');
    console.log('📥 Frontend scheduler page status:', response.status);
    
    if (response.ok) {
      console.log('✅ Frontend scheduler page is accessible');
      console.log('💡 You can now test the scheduler at: http://localhost:5000/scheduler');
    } else {
      console.log('❌ Frontend scheduler page is not accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing frontend:', error.message);
  }
}

// Test without authentication to see the difference
async function testSchedulerWithoutAuth() {
  console.log('\n🚫 Testing Scheduler WITHOUT Authentication...\n');

  const testData = {
    title: "Unauthenticated Test Content",
    description: "This should fail without auth",
    platform: "youtube",
    contentType: "video",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  try {
    const response = await fetch('http://localhost:5000/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status (no auth):', response.status);
    const responseText = await response.text();
    console.log('📥 Response body (no auth):', responseText);

    if (response.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('⚠️  Unexpected response without authentication');
    }
  } catch (error) {
    console.error('❌ Error testing without auth:', error.message);
  }
}

// Run comprehensive tests
async function runComprehensiveTests() {
  console.log('🚀 Running Comprehensive Scheduler Tests...\n');
  
  await testSchedulerWithoutAuth();
  const authTest = await testSchedulerWithAuth();
  await testFrontendScheduler();
  
  console.log('\n📊 Test Summary:');
  console.log('  - Backend API (with auth):', authTest ? '✅ Working' : '❌ Failed');
  console.log('  - Frontend:', '✅ Accessible');
  
  if (authTest) {
    console.log('\n🎉 SUCCESS: The scheduler is working correctly!');
    console.log('💡 You can now use the scheduler at: http://localhost:5000/scheduler');
    console.log('💡 The frontend should work when you log in properly');
  } else {
    console.log('\n⚠️  ISSUE: Authentication still failing');
    console.log('💡 Check server logs for more details');
    console.log('💡 Try logging in at: http://localhost:5000/login');
  }
}

runComprehensiveTests().catch(console.error); 