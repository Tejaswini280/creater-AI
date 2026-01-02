import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testScheduledContent() {
  console.log('🧪 Testing Scheduled Content Functionality...\n');

  try {
    // Test 1: Get current scheduled content
    console.log('1️⃣ Testing GET /api/content/scheduled...');
    const getResponse = await fetch(`${BASE_URL}/api/content/scheduled`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    console.log('✅ GET Response:', JSON.stringify(getData, null, 2));
    console.log(`📊 Current scheduled content count: ${getData.scheduledContent?.length || 0}\n`);

    // Test 2: Create new scheduled content
    console.log('2️⃣ Testing POST /api/content/schedule...');
    const newContent = {
      title: 'Test Scheduled Content',
      description: 'This is a test scheduled content',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };

    const createResponse = await fetch(`${BASE_URL}/api/content/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newContent)
    });

    if (!createResponse.ok) {
      throw new Error(`POST failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log('✅ POST Response:', JSON.stringify(createData, null, 2));
    console.log(`📝 Created content ID: ${createData.scheduledContent?.id}\n`);

    // Test 3: Get scheduled content again to verify it was created
    console.log('3️⃣ Testing GET /api/content/scheduled again...');
    const getResponse2 = await fetch(`${BASE_URL}/api/content/scheduled`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse2.ok) {
      throw new Error(`GET failed: ${getResponse2.status} ${getResponse2.statusText}`);
    }

    const getData2 = await getResponse2.json();
    console.log('✅ GET Response (after creation):', JSON.stringify(getData2, null, 2));
    console.log(`📊 New scheduled content count: ${getData2.scheduledContent?.length || 0}`);

    // Verify the content was actually created
    const originalCount = getData.scheduledContent?.length || 0;
    const newCount = getData2.scheduledContent?.length || 0;
    
    if (newCount > originalCount) {
      console.log('🎉 SUCCESS: Content was successfully created and appears in the list!');
    } else {
      console.log('❌ FAILURE: Content was not added to the scheduled content list');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

// Run the test
testScheduledContent();
