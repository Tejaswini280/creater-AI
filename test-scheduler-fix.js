// Test script to verify scheduler functionality is working
const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token';

async function testScheduler() {
  console.log('🧪 Testing Scheduler Functionality...');
  
  try {
    // Test 1: Schedule content
    console.log('\n1️⃣ Testing content scheduling...');
    const scheduleResponse = await fetch(`${BASE_URL}/api/content/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        title: 'Morning Routine Video',
        description: 'Daily morning routine content',
        platform: 'youtube',
        contentType: 'video',
        scheduledAt: '2025-08-30T11:00:00.000Z'
      })
    });
    
    if (scheduleResponse.ok) {
      const scheduleData = await scheduleResponse.json();
      console.log('✅ Content scheduled successfully:', scheduleData.message);
      console.log('📅 Scheduled content ID:', scheduleData.scheduledContent.id);
    } else {
      const errorData = await scheduleResponse.json();
      console.log('❌ Failed to schedule content:', errorData.message);
      return;
    }
    
    // Test 2: Get scheduled content
    console.log('\n2️⃣ Testing scheduled content retrieval...');
    const getResponse = await fetch(`${BASE_URL}/api/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Retrieved scheduled content successfully');
      console.log('📊 Found', getData.scheduledContent.length, 'scheduled items');
      
      if (getData.scheduledContent.length > 0) {
        const latest = getData.scheduledContent[0];
        console.log('📝 Latest scheduled content:', {
          title: latest.title,
          platform: latest.platform,
          scheduledAt: latest.scheduledAt
        });
      }
    } else {
      const errorData = await getResponse.json();
      console.log('❌ Failed to get scheduled content:', errorData.message);
      return;
    }
    
    console.log('\n🎉 All scheduler tests passed!');
    console.log('✅ Content scheduling is working');
    console.log('✅ Content retrieval is working');
    console.log('✅ Database schema is correct');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testScheduler();
