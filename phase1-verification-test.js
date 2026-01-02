import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password'
};

const testContent = {
  title: 'Test Content Creation',
  description: 'Testing the content creation endpoint',
  platform: 'youtube',
  contentType: 'video',
  tags: ['test', 'verification'],
  metadata: {
    duration: '5:00',
    category: 'tutorial'
  }
};

const testAIRequest = {
  topic: 'Artificial Intelligence in Content Creation',
  platform: 'youtube',
  duration: '60 seconds'
};

const testIdeasRequest = {
  niche: 'Technology',
  platform: 'youtube',
  count: 3
};

async function login() {
  try {
    console.log('🔐 Testing login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    
    if (response.data.accessToken) {
      authToken = response.data.accessToken;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed - no access token');
      return false;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testContentCreation() {
  try {
    console.log('\n📝 Testing content creation...');
    const response = await axios.post(`${BASE_URL}/api/content`, testContent, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.content) {
      console.log('✅ Content creation successful');
      console.log('   - Content ID:', response.data.content.id);
      console.log('   - Title:', response.data.content.title);
      console.log('   - Status:', response.data.content.status);
      return response.data.content.id;
    } else {
      console.log('❌ Content creation failed - invalid response');
      return null;
    }
  } catch (error) {
    console.log('❌ Content creation failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testContentRetrieval() {
  try {
    console.log('\n📋 Testing content retrieval...');
    const response = await axios.get(`${BASE_URL}/api/content`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && Array.isArray(response.data.content)) {
      console.log('✅ Content retrieval successful');
      console.log('   - Total content:', response.data.total);
      console.log('   - Content items:', response.data.content.length);
      
      if (response.data.content.length > 0) {
        const firstContent = response.data.content[0];
        console.log('   - First content title:', firstContent.title);
        console.log('   - First content platform:', firstContent.platform);
      }
      return true;
    } else {
      console.log('❌ Content retrieval failed - invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Content retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testContentAnalytics() {
  try {
    console.log('\n📊 Testing content analytics...');
    const response = await axios.get(`${BASE_URL}/api/content/analytics?period=30d`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.analytics) {
      console.log('✅ Content analytics successful');
      console.log('   - Total content:', response.data.analytics.totalContent);
      console.log('   - Total views:', response.data.analytics.totalViews);
      console.log('   - Average engagement:', response.data.analytics.averageEngagement);
      console.log('   - Platform breakdown:', Object.keys(response.data.analytics.platformBreakdown).length, 'platforms');
      return true;
    } else {
      console.log('❌ Content analytics failed - invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Content analytics failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAIScriptGeneration() {
  try {
    console.log('\n🤖 Testing AI script generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/generate-script`, testAIRequest, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.script) {
      console.log('✅ AI script generation successful');
      console.log('   - Script length:', response.data.script.length, 'characters');
      console.log('   - Platform:', response.data.platform);
      console.log('   - Duration:', response.data.duration);
      console.log('   - Task ID:', response.data.taskId || 'N/A');
      
      // Check if script contains expected elements
      const hasHook = response.data.script.includes('HOOK') || response.data.script.includes('Hey');
      const hasContent = response.data.script.includes('CONTENT') || response.data.script.includes('points');
      const hasCTA = response.data.script.includes('CALL TO ACTION') || response.data.script.includes('subscribe');
      
      console.log('   - Contains hook:', hasHook ? '✅' : '❌');
      console.log('   - Contains content:', hasContent ? '✅' : '❌');
      console.log('   - Contains CTA:', hasCTA ? '✅' : '❌');
      
      return true;
    } else {
      console.log('❌ AI script generation failed - no script returned');
      return false;
    }
  } catch (error) {
    console.log('❌ AI script generation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAIContentIdeas() {
  try {
    console.log('\n💡 Testing AI content ideas generation...');
    const response = await axios.post(`${BASE_URL}/api/ai/content-ideas`, testIdeasRequest, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && Array.isArray(response.data.ideas)) {
      console.log('✅ AI content ideas generation successful');
      console.log('   - Ideas count:', response.data.ideas.length);
      console.log('   - Niche:', response.data.niche);
      console.log('   - Platform:', response.data.platform);
      
      response.data.ideas.forEach((idea, index) => {
        console.log(`   - Idea ${index + 1}:`, idea.substring(0, 50) + '...');
      });
      
      return true;
    } else {
      console.log('❌ AI content ideas generation failed - invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ AI content ideas generation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('\n🗄️ Testing database connection...');
    const response = await axios.get(`${BASE_URL}/api/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data) {
      console.log('✅ Database connection successful');
      console.log('   - Total views:', response.data.totalViews);
      console.log('   - Total subscribers:', response.data.totalSubscribers);
      console.log('   - Total revenue:', response.data.totalRevenue);
      console.log('   - Average engagement:', response.data.avgEngagement);
      return true;
    } else {
      console.log('❌ Database connection failed - no response data');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testTemplateLibrary() {
  try {
    console.log('\n📚 Testing template library...');
    const response = await axios.get(`${BASE_URL}/api/templates`);
    
    if (response.data.success && Array.isArray(response.data.templates)) {
      console.log('✅ Template library successful');
      console.log('   - Templates count:', response.data.templates.length);
      
      if (response.data.templates.length > 0) {
        const firstTemplate = response.data.templates[0];
        console.log('   - First template:', firstTemplate.title);
        console.log('   - Category:', firstTemplate.category);
        console.log('   - Downloads:', firstTemplate.downloads);
      }
      return true;
    } else {
      console.log('❌ Template library failed - invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Template library failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Phase 1 Verification Tests...\n');
  
  const results = {
    login: false,
    contentCreation: false,
    contentRetrieval: false,
    contentAnalytics: false,
    aiScriptGeneration: false,
    aiContentIdeas: false,
    databaseConnection: false,
    templateLibrary: false
  };
  
  // Test login first
  results.login = await login();
  
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return results;
  }
  
  // Test all Phase 1 features
  results.contentCreation = await testContentCreation();
  results.contentRetrieval = await testContentRetrieval();
  results.contentAnalytics = await testContentAnalytics();
  results.aiScriptGeneration = await testAIScriptGeneration();
  results.aiContentIdeas = await testAIContentIdeas();
  results.databaseConnection = await testDatabaseConnection();
  results.templateLibrary = await testTemplateLibrary();
  
  // Summary
  console.log('\n📊 PHASE 1 VERIFICATION SUMMARY');
  console.log('================================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${successRate}%`);
  
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${test}: ${status}`);
  });
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL PHASE 1 TESTS PASSED!');
    console.log('✅ Task 1.2 (Basic Content Creation) - COMPLETE');
    console.log('✅ Task 1.3 (Basic AI Generation) - COMPLETE');
    console.log('✅ Task 1.4 (Database Setup) - COMPLETE');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests }; 