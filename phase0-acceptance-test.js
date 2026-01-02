/**
 * Phase 0 Acceptance Criteria Test Suite
 * Tests all requirements from QA_Audit.md Phase 0 tasks
 */

const baseUrl = 'http://localhost:5000';
const frontendUrl = 'http://localhost:3000';

// Test configuration
const testConfig = {
  testUser: {
    email: 'test@example.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User'
  },
  authHeaders: {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Starting Phase 0 Acceptance Criteria Tests...\n');

// Task 0.1: Recent Content Section Implementation
async function testTask01_RecentContentSection() {
  console.log('📋 Task 0.1: Recent Content Section Implementation');
  console.log('=' .repeat(60));
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: "Create Your First Content" button functionality
  try {
    console.log('✅ Test 1: Content creation endpoint exists');
    const response = await fetch(`${baseUrl}/api/content/create`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        title: 'Test Content',
        description: 'Test Description',
        platform: 'youtube',
        contentType: 'video'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Content creation API working:', data.success);
      testResults.passed++;
    } else {
      console.log('❌ Content creation API failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Content creation API error:', error.message);
    testResults.failed++;
  }

  // Test 2: Content listing functionality
  try {
    console.log('✅ Test 2: Content listing endpoint');
    const response = await fetch(`${baseUrl}/api/content`, {
      headers: testConfig.authHeaders
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Content listing API working, found:', data.content?.length || 0, 'items');
      testResults.passed++;
    } else {
      console.log('❌ Content listing API failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Content listing API error:', error.message);
    testResults.failed++;
  }

  // Test 3: Form validation
  try {
    console.log('✅ Test 3: Content creation validation');
    const response = await fetch(`${baseUrl}/api/content/create`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({}) // Empty body to test validation
    });
    
    // Should fail validation
    if (!response.ok) {
      console.log('✅ Content validation working (correctly rejected empty data)');
      testResults.passed++;
    } else {
      console.log('❌ Content validation failed (accepted empty data)');
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Content validation test error:', error.message);
    testResults.failed++;
  }

  console.log(`\n📊 Task 0.1 Results: ${testResults.passed} passed, ${testResults.failed} failed\n`);
  return testResults;
}

// Task 0.2: Notification System Implementation
async function testTask02_NotificationSystem() {
  console.log('📋 Task 0.2: Notification System Implementation');
  console.log('=' .repeat(60));
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Notification endpoint existence
  try {
    console.log('✅ Test 1: Notifications endpoint');
    const response = await fetch(`${baseUrl}/api/notifications`, {
      headers: testConfig.authHeaders
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notifications API working');
      testResults.passed++;
    } else {
      console.log('❌ Notifications API failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Notifications API error:', error.message);
    testResults.failed++;
  }

  // Test 2: Mark notification as read
  try {
    console.log('✅ Test 2: Mark notification as read');
    const response = await fetch(`${baseUrl}/api/notifications/1/read`, {
      method: 'POST',
      headers: testConfig.authHeaders
    });
    
    if (response.ok) {
      console.log('✅ Mark as read API working');
      testResults.passed++;
    } else {
      console.log('❌ Mark as read API failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Mark as read API error:', error.message);
    testResults.failed++;
  }

  console.log(`\n📊 Task 0.2 Results: ${testResults.passed} passed, ${testResults.failed} failed\n`);
  return testResults;
}

// Task 0.3: AI Assistant Modal Implementation
async function testTask03_AIAssistantModal() {
  console.log('📋 Task 0.3: AI Assistant Modal Implementation');
  console.log('=' .repeat(60));
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: AI generation endpoints
  try {
    console.log('✅ Test 1: AI script generation');
    const response = await fetch(`${baseUrl}/api/ai/generate-script`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        topic: 'Test topic',
        platform: 'youtube',
        contentType: 'video'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI script generation working');
      testResults.passed++;
    } else {
      console.log('❌ AI script generation failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ AI script generation error:', error.message);
    testResults.failed++;
  }

  // Test 2: AI ideas generation
  try {
    console.log('✅ Test 2: AI ideas generation');
    const response = await fetch(`${baseUrl}/api/ai/generate-ideas`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        niche: 'Test topic',
        platform: 'youtube'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI ideas generation working');
      testResults.passed++;
    } else {
      console.log('❌ AI ideas generation failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ AI ideas generation error:', error.message);
    testResults.failed++;
  }

  console.log(`\n📊 Task 0.3 Results: ${testResults.passed} passed, ${testResults.failed} failed\n`);
  return testResults;
}

// Task 0.4: Quick Actions Panel Implementation
async function testTask04_QuickActionsPanel() {
  console.log('📋 Task 0.4: Quick Actions Panel Implementation');
  console.log('=' .repeat(60));
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Generate Script action
  try {
    console.log('✅ Test 1: Generate Script quick action');
    const response = await fetch(`${baseUrl}/api/ai/generate-script`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        topic: 'Quick test script',
        platform: 'youtube'
      })
    });
    
    if (response.ok) {
      console.log('✅ Generate Script quick action working');
      testResults.passed++;
    } else {
      console.log('❌ Generate Script quick action failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Generate Script quick action error:', error.message);
    testResults.failed++;
  }

  // Test 2: AI Voiceover action
  try {
    console.log('✅ Test 2: AI Voiceover action');
    const response = await fetch(`${baseUrl}/api/ai/generate-voiceover`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        script: 'Test voiceover text',
        voice: 'alloy'
      })
    });
    
    if (response.ok) {
      console.log('✅ AI Voiceover action working');
      testResults.passed++;
    } else {
      console.log('❌ AI Voiceover action failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ AI Voiceover action error:', error.message);
    testResults.failed++;
  }

  // Test 3: Create Thumbnail action
  try {
    console.log('✅ Test 3: Create Thumbnail action');
    const response = await fetch(`${baseUrl}/api/ai/generate-thumbnail`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        prompt: 'Test thumbnail',
        style: 'realistic'
      })
    });
    
    if (response.ok) {
      console.log('✅ Create Thumbnail action working');
      testResults.passed++;
    } else {
      console.log('❌ Create Thumbnail action failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Create Thumbnail action error:', error.message);
    testResults.failed++;
  }

  // Test 4: Schedule Post action
  try {
    console.log('✅ Test 4: Schedule Post action');
    const response = await fetch(`${baseUrl}/api/content/schedule`, {
      method: 'POST',
      headers: testConfig.authHeaders,
      body: JSON.stringify({
        title: 'Test Scheduled Content',
        content: 'This is test content for scheduling',
        platform: 'youtube',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    });
    
    if (response.ok) {
      console.log('✅ Schedule Post action working');
      testResults.passed++;
    } else {
      console.log('❌ Schedule Post action failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Schedule Post action error:', error.message);
    testResults.failed++;
  }

  console.log(`\n📊 Task 0.4 Results: ${testResults.passed} passed, ${testResults.failed} failed\n`);
  return testResults;
}

// Additional Dashboard Integration Tests
async function testDashboardIntegration() {
  console.log('📋 Dashboard Integration Tests');
  console.log('=' .repeat(60));
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test authentication flow
  try {
    console.log('✅ Test 1: Authentication check');
    const response = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: testConfig.authHeaders
    });
    
    if (response.ok) {
      console.log('✅ Authentication working');
      testResults.passed++;
    } else {
      console.log('❌ Authentication failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    testResults.failed++;
  }

  // Test analytics endpoint
  try {
    console.log('✅ Test 2: Analytics endpoint');
    const response = await fetch(`${baseUrl}/api/content/analytics`, {
      headers: testConfig.authHeaders
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Analytics working, data available:', !!data);
      testResults.passed++;
    } else {
      console.log('❌ Analytics failed:', response.status);
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Analytics error:', error.message);
    testResults.failed++;
  }

  console.log(`\n📊 Dashboard Integration Results: ${testResults.passed} passed, ${testResults.failed} failed\n`);
  return testResults;
}

// Run all tests
async function runAllTests() {
  console.log('🎯 PHASE 0 ACCEPTANCE CRITERIA TESTING');
  console.log('=' .repeat(80));
  console.log('Testing all acceptance criteria and test cases for Phase 0\n');

  const allResults = [];

  try {
    // Run each task test
    allResults.push(await testTask01_RecentContentSection());
    allResults.push(await testTask02_NotificationSystem());
    allResults.push(await testTask03_AIAssistantModal());
    allResults.push(await testTask04_QuickActionsPanel());
    allResults.push(await testDashboardIntegration());

    // Calculate overall results
    const totalPassed = allResults.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = allResults.reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    console.log('🎯 PHASE 0 FINAL RESULTS');
    console.log('=' .repeat(80));
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🎯 Target: 100% (All acceptance criteria must pass)`);

    if (successRate === '100.0') {
      console.log('\n🎉 SUCCESS: All Phase 0 acceptance criteria PASSED!');
      console.log('✅ Ready to proceed to next phase');
    } else {
      console.log('\n⚠️ INCOMPLETE: Phase 0 acceptance criteria not fully met');
      console.log('❌ Must fix failing tests before proceeding');
      console.log('\n🔍 Failed Tests Need Investigation:');
      
      allResults.forEach((result, index) => {
        if (result.failed > 0) {
          const taskNames = ['Task 0.1', 'Task 0.2', 'Task 0.3', 'Task 0.4', 'Dashboard Integration'];
          console.log(`   - ${taskNames[index]}: ${result.failed} failures`);
        }
      });
    }

    return { successRate, totalPassed, totalFailed, allResults };

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    return { successRate: 0, totalPassed: 0, totalFailed: 1, error: error.message };
  }
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = { runAllTests, testTask01_RecentContentSection, testTask02_NotificationSystem, testTask03_AIAssistantModal, testTask04_QuickActionsPanel };
} else {
  // Run tests if executed directly
  runAllTests().then(results => {
    console.log('\n📋 Test execution completed');
    process.exit(results.successRate === '100.0' ? 0 : 1);
  });
}