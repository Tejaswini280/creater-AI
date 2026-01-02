const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token';

const testConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

async function testScheduledContentFlow() {
  console.log('🧪 Testing Scheduled Content Flow...\n');

  try {
    // Step 1: Get initial scheduled content
    console.log('1️⃣ Getting initial scheduled content...');
    const initialResponse = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
    console.log('Initial scheduled content:', initialResponse.data);
    const initialCount = initialResponse.data.scheduledContent?.length || 0;
    console.log(`Initial count: ${initialCount}\n`);

    // Step 2: Create new scheduled content
    console.log('2️⃣ Creating new scheduled content...');
    const newContent = {
      title: 'Debug Test Content',
      description: 'This is a test content created for debugging',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      autoPost: true,
      timezone: 'UTC'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/content/schedule`, newContent, testConfig);
    console.log('Create response:', createResponse.data);
    console.log('✅ Content created successfully\n');

    // Step 3: Get scheduled content again
    console.log('3️⃣ Getting scheduled content after creation...');
    const afterCreateResponse = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
    console.log('After creation scheduled content:', afterCreateResponse.data);
    const afterCreateCount = afterCreateResponse.data.scheduledContent?.length || 0;
    console.log(`After creation count: ${afterCreateCount}\n`);

    // Step 4: Check if new content is in the list
    const newContentInList = afterCreateResponse.data.scheduledContent?.find(
      content => content.title === 'Debug Test Content'
    );
    
    if (newContentInList) {
      console.log('✅ SUCCESS: New content found in scheduled list!');
      console.log('New content details:', newContentInList);
    } else {
      console.log('❌ FAILURE: New content NOT found in scheduled list!');
      console.log('Available content titles:', afterCreateResponse.data.scheduledContent?.map(c => c.title));
    }

    // Step 5: Check if count increased
    if (afterCreateCount > initialCount) {
      console.log(`✅ SUCCESS: Count increased from ${initialCount} to ${afterCreateCount}`);
    } else {
      console.log(`❌ FAILURE: Count did not increase (${initialCount} -> ${afterCreateCount})`);
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testScheduledContentFlow();
