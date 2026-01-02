const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token';

const testConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

async function testContentPlannerDataFlow() {
  console.log('🧪 Testing Content Planner Data Flow...\n');

  try {
    // Step 1: Get scheduled content from the API endpoint used by ContentPlanner
    console.log('1️⃣ Getting scheduled content from Content Planner API...');
    const response = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
    console.log('API Response:', response.data);

    if (response.data.success && response.data.scheduledContent) {
      console.log('✅ SUCCESS: API returned scheduled content!');
      console.log(`Found ${response.data.scheduledContent.length} scheduled items`);

      // Check if data structure matches what ContentPlanner expects
      if (response.data.scheduledContent.length > 0) {
        const firstItem = response.data.scheduledContent[0];
        console.log('Sample content item:', firstItem);

        const requiredFields = ['id', 'title', 'platform', 'contentType', 'scheduledAt', 'status'];
        const missingFields = requiredFields.filter(field => !(field in firstItem));

        if (missingFields.length === 0) {
          console.log('✅ SUCCESS: Data structure matches ContentPlanner expectations');
        } else {
          console.log('⚠️  WARNING: Missing fields:', missingFields);
        }
      } else {
        console.log('ℹ️  No scheduled content found - this is normal for a fresh system');
      }
    } else {
      console.log('❌ FAILURE: API did not return expected structure');
      console.log('Expected: { success: true, scheduledContent: [...] }');
    }

    // Step 2: Test real-time update simulation
    console.log('\n2️⃣ Testing real-time update simulation...');

    // Create test content
    const testContent = {
      title: 'Real-time Test Content',
      description: 'This is a test for real-time updates',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      autoPost: true,
      timezone: 'UTC'
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/api/content/schedule`, testContent, testConfig);
      console.log('✅ Content created for real-time test:', createResponse.data);

      // Verify it appears in the scheduled list
      const verifyResponse = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
      const newContentInList = verifyResponse.data.scheduledContent?.find(
        content => content.title === 'Real-time Test Content'
      );

      if (newContentInList) {
        console.log('✅ SUCCESS: New content appears in scheduled list');
        console.log('Content ID:', newContentInList.id);
      } else {
        console.log('❌ FAILURE: New content does not appear in scheduled list');
      }
    } catch (createError) {
      console.log('⚠️  Could not create test content (this might be expected if user is not authenticated):', createError.response?.data?.message || createError.message);
    }

  } catch (error) {
    console.error('❌ Error during Content Planner test:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server appears to be offline. Make sure to start the server first:');
      console.log('   npm run dev');
    }
  }
}

// Test WebSocket connection info
async function testWebSocketInfo() {
  console.log('\n🔌 Testing WebSocket connection info...');

  try {
    const wsResponse = await axios.get(`${BASE_URL}/api/websocket/connect`, testConfig);
    console.log('WebSocket connection info:', wsResponse.data);
  } catch (error) {
    console.log('⚠️  Could not get WebSocket info (this might be expected):', error.response?.data?.message || error.message);
  }
}

// Run the tests
async function runAllTests() {
  await testContentPlannerDataFlow();
  await testWebSocketInfo();
}

runAllTests();







