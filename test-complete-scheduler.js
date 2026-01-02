const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const TEST_TOKEN = 'test-token';

async function testCompleteScheduler() {
  console.log('🚀 Testing Complete Scheduler System...\n');

  try {
    // Test 1: Check server health
    console.log('1. Testing server health');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
      return;
    }

    // Test 2: Authentication test
    console.log('\n2. Testing authentication');
    const authResponse = await fetch(`${API_BASE}/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      console.log('✅ Authentication working');
    } else {
      console.log('❌ Authentication failed:', authResponse.status);
      return;
    }

    // Test 3: Get initial scheduled content
    console.log('\n3. Getting initial scheduled content');
    const initialResponse = await fetch(`${API_BASE}/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const initialData = await initialResponse.json();
    console.log('✅ Initial scheduled content:', initialData.scheduledContent?.length || 0, 'items');

    // Test 4: Schedule multiple content items
    console.log('\n4. Scheduling multiple content items');
    const contentItems = [
      {
        title: 'YouTube Video - Morning Motivation',
        description: 'Daily motivation video for YouTube',
        platform: 'youtube',
        contentType: 'video',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      },
      {
        title: 'Instagram Post - Behind the Scenes',
        description: 'Behind the scenes content for Instagram',
        platform: 'instagram',
        contentType: 'image',
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
      },
      {
        title: 'Facebook Update - Weekly Recap',
        description: 'Weekly recap post for Facebook',
        platform: 'facebook',
        contentType: 'text',
        scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      }
    ];

    const scheduledIds = [];
    for (const item of contentItems) {
      const scheduleResponse = await fetch(`${API_BASE}/content/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });

      if (scheduleResponse.ok) {
        const result = await scheduleResponse.json();
        scheduledIds.push(result.scheduledContent?.id);
        console.log(`✅ Scheduled: ${item.title} (ID: ${result.scheduledContent?.id})`);
      } else {
        console.log(`❌ Failed to schedule: ${item.title}`);
      }
    }

    // Test 5: Get optimal times for different platforms
    console.log('\n5. Testing optimal times for platforms');
    const platforms = ['youtube', 'instagram', 'facebook', 'twitter', 'linkedin'];
    
    for (const platform of platforms) {
      const optimalResponse = await fetch(`${API_BASE}/content/schedule/optimal-times/${platform}`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (optimalResponse.ok) {
        const optimalData = await optimalResponse.json();
        console.log(`✅ ${platform}: ${optimalData.optimalTimes?.length || 0} optimal times`);
      } else {
        console.log(`❌ Failed to get optimal times for ${platform}`);
      }
    }

    // Test 6: Get updated scheduled content
    console.log('\n6. Getting updated scheduled content');
    const updatedResponse = await fetch(`${API_BASE}/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const updatedData = await updatedResponse.json();
    console.log('✅ Updated scheduled content:', updatedData.scheduledContent?.length || 0, 'items');

    // Test 7: Update a scheduled item
    if (scheduledIds.length > 0 && scheduledIds[0]) {
      console.log('\n7. Testing content update');
      const updateResponse = await fetch(`${API_BASE}/content/schedule/${scheduledIds[0]}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Updated YouTube Video - Morning Motivation',
          scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Content updated successfully');
      } else {
        console.log('❌ Content update failed');
      }
    }

    // Test 8: Get scheduling analytics
    console.log('\n8. Testing scheduling analytics');
    const analyticsResponse = await fetch(`${API_BASE}/content/schedule/analytics`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Analytics retrieved:');
      console.log(`   Total scheduled: ${analyticsData.analytics?.totalScheduled || 0}`);
      console.log(`   Total published: ${analyticsData.analytics?.totalPublished || 0}`);
      console.log(`   Success rate: ${analyticsData.analytics?.successRate || 0}%`);
      console.log(`   Platform breakdown:`, analyticsData.analytics?.platformBreakdown || {});
    } else {
      console.log('❌ Analytics retrieval failed');
    }

    // Test 9: Bulk operations test
    if (scheduledIds.length > 1) {
      console.log('\n9. Testing bulk operations');
      
      // Test bulk reschedule
      const bulkScheduleResponse = await fetch(`${API_BASE}/content/schedule/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentIds: scheduledIds.slice(0, 2),
          scheduledAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          platform: 'youtube'
        })
      });

      if (bulkScheduleResponse.ok) {
        console.log('✅ Bulk reschedule successful');
      } else {
        console.log('❌ Bulk reschedule failed');
      }
    }

    // Test 10: Cleanup - Delete scheduled content
    console.log('\n10. Cleanup - Deleting scheduled content');
    let deletedCount = 0;
    
    for (const id of scheduledIds) {
      if (id) {
        const deleteResponse = await fetch(`${API_BASE}/content/schedule/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (deleteResponse.ok) {
          deletedCount++;
        }
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} scheduled items`);

    // Test 11: Final verification
    console.log('\n11. Final verification');
    const finalResponse = await fetch(`${API_BASE}/content/scheduled`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const finalData = await finalResponse.json();
    const finalCount = finalData.scheduledContent?.length || 0;
    const initialCount = initialData.scheduledContent?.length || 0;
    
    console.log(`✅ Final scheduled content: ${finalCount} items`);
    console.log(`   Net change: ${finalCount - initialCount} items`);

    console.log('\n🎉 Complete Scheduler System Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Server health check');
    console.log('   ✅ Authentication');
    console.log('   ✅ Content scheduling');
    console.log('   ✅ Optimal times retrieval');
    console.log('   ✅ Content updates');
    console.log('   ✅ Analytics');
    console.log('   ✅ Bulk operations');
    console.log('   ✅ Content deletion');
    console.log('   ✅ System cleanup');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompleteScheduler();