const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const TEST_TOKEN = 'test-token';

async function testSchedulerFunctionality() {
  console.log('🧪 Testing Scheduler Functionality...\n');

  try {
    // Test 1: Get scheduled content (should be empty initially)
    console.log('1. Testing GET /api/content/scheduled');
    const scheduledResponse = await fetch(`${API_BASE}/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (scheduledResponse.ok) {
      const scheduledData = await scheduledResponse.json();
      console.log('✅ GET scheduled content:', scheduledData.scheduledContent?.length || 0, 'items');
    } else {
      console.log('❌ GET scheduled content failed:', scheduledResponse.status);
    }

    // Test 2: Schedule new content
    console.log('\n2. Testing POST /api/content/schedule');
    const scheduleData = {
      title: 'Test Scheduled Content',
      description: 'This is a test scheduled content',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    };

    const scheduleResponse = await fetch(`${API_BASE}/content/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scheduleData)
    });

    let scheduledContentId = null;
    if (scheduleResponse.ok) {
      const scheduleResult = await scheduleResponse.json();
      scheduledContentId = scheduleResult.scheduledContent?.id;
      console.log('✅ POST schedule content:', scheduleResult.success ? 'Success' : 'Failed');
      console.log('   Content ID:', scheduledContentId);
    } else {
      console.log('❌ POST schedule content failed:', scheduleResponse.status);
      const errorText = await scheduleResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 3: Get optimal times for platform
    console.log('\n3. Testing GET /api/content/schedule/optimal-times/youtube');
    const optimalTimesResponse = await fetch(`${API_BASE}/content/schedule/optimal-times/youtube`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (optimalTimesResponse.ok) {
      const optimalData = await optimalTimesResponse.json();
      console.log('✅ GET optimal times:', optimalData.optimalTimes?.length || 0, 'times');
      console.log('   Times:', optimalData.optimalTimes);
    } else {
      console.log('❌ GET optimal times failed:', optimalTimesResponse.status);
    }

    // Test 4: Update scheduled content (if we have an ID)
    if (scheduledContentId) {
      console.log('\n4. Testing PUT /api/content/schedule/:id');
      const updateData = {
        title: 'Updated Test Scheduled Content',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      };

      const updateResponse = await fetch(`${API_BASE}/content/schedule/${scheduledContentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ PUT update content:', updateResult.success ? 'Success' : 'Failed');
      } else {
        console.log('❌ PUT update content failed:', updateResponse.status);
      }
    }

    // Test 5: Get scheduling analytics
    console.log('\n5. Testing GET /api/content/schedule/analytics');
    const analyticsResponse = await fetch(`${API_BASE}/content/schedule/analytics`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ GET analytics:', analyticsData.success ? 'Success' : 'Failed');
      console.log('   Total scheduled:', analyticsData.analytics?.totalScheduled || 0);
      console.log('   Success rate:', analyticsData.analytics?.successRate || 0, '%');
    } else {
      console.log('❌ GET analytics failed:', analyticsResponse.status);
    }

    // Test 6: Delete scheduled content (cleanup)
    if (scheduledContentId) {
      console.log('\n6. Testing DELETE /api/content/schedule/:id');
      const deleteResponse = await fetch(`${API_BASE}/content/schedule/${scheduledContentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ DELETE content:', deleteResult.success ? 'Success' : 'Failed');
      } else {
        console.log('❌ DELETE content failed:', deleteResponse.status);
      }
    }

    console.log('\n🎉 Scheduler functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSchedulerFunctionality();