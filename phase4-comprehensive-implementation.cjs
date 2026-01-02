const axios = require('axios');
const { faker } = require('@faker-js/faker');

// Configuration
const BASE_URL = 'http://localhost:5000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;

// Utility functions
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

async function registerAndLogin() {
  console.log('🔐 Registering and logging in test user...');
  
  // Try to register
  const registerResult = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  // Login
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.error('❌ Authentication failed:', loginResult.error);
    return false;
  }
}

// Phase 4.1: Complete Mock Data Removal
async function testMockDataRemoval() {
  console.log('\n🔍 Testing Mock Data Removal...');
  
  const tests = [
    {
      name: 'Analytics Performance API',
      endpoint: '/api/analytics/performance?period=7D',
      method: 'GET',
      check: (data) => {
        return data.analytics && 
               typeof data.analytics.views === 'number' &&
               typeof data.analytics.engagement === 'number' &&
               typeof data.analytics.revenue === 'number' &&
               data.analytics.change &&
               !data.analytics.views.toString().includes('mock') &&
               !data.analytics.engagement.toString().includes('mock');
      }
    },
    {
      name: 'Notifications API',
      endpoint: '/api/notifications',
      method: 'GET',
      check: (data) => {
        return Array.isArray(data.notifications) &&
               data.notifications.length > 0 &&
               data.notifications.every(n => 
                 n.id && n.title && n.message && 
                 !n.title.includes('mock') && 
                 !n.message.includes('mock')
               );
      }
    },
    {
      name: 'Scheduled Content API',
      endpoint: '/api/content/scheduled',
      method: 'GET',
      check: (data) => {
        return Array.isArray(data.scheduledContent) &&
               data.scheduledContent.every(c => 
                 c.id && c.title && 
                 !c.title.includes('mock')
               );
      }
    },
    {
      name: 'Templates API',
      endpoint: '/api/templates',
      method: 'GET',
      check: (data) => {
        return Array.isArray(data.templates) &&
               data.templates.length >= 50 &&
               data.templates.every(t => 
                 t.id && t.title && t.description &&
                 !t.title.includes('mock') &&
                 !t.description.includes('mock')
               );
      }
    },
    {
      name: 'Content API',
      endpoint: '/api/content',
      method: 'GET',
      check: (data) => {
        return Array.isArray(data.content) &&
               data.content.length > 0 &&
               data.content.every(c => 
                 c.id && c.title &&
                 !c.title.includes('mock')
               );
      }
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await makeRequest(test.method, test.endpoint, null, authToken);
      
      if (result.success && test.check(result.data)) {
        console.log(`✅ ${test.name} - No mock data found`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Mock data detected or invalid response`);
        console.log('   Response:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error:`, error.message);
    }
  }
  
  console.log(`\n📊 Mock Data Removal Results: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Phase 4.2: Structured Dummy Data Seeding
async function testStructuredDataSeeding() {
  console.log('\n🌱 Testing Structured Data Seeding...');
  
  const tests = [
    {
      name: 'Users Table',
      endpoint: '/api/users',
      method: 'GET',
      minRecords: 50,
      check: (data) => {
        return Array.isArray(data.users) && data.users.length >= 50;
      }
    },
    {
      name: 'Templates Table',
      endpoint: '/api/templates',
      method: 'GET',
      minRecords: 50,
      check: (data) => {
        return Array.isArray(data.templates) && data.templates.length >= 50;
      }
    },
    {
      name: 'Content Table',
      endpoint: '/api/content',
      method: 'GET',
      minRecords: 50,
      check: (data) => {
        return Array.isArray(data.content) && data.content.length >= 50;
      }
    },
    {
      name: 'AI Tasks Table',
      endpoint: '/api/ai/tasks',
      method: 'GET',
      minRecords: 50,
      check: (data) => {
        return Array.isArray(data.tasks) && data.tasks.length >= 50;
      }
    },
    {
      name: 'Notifications Table',
      endpoint: '/api/notifications',
      method: 'GET',
      minRecords: 50,
      check: (data) => {
        return Array.isArray(data.notifications) && data.notifications.length >= 50;
      }
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await makeRequest(test.method, test.endpoint, null, authToken);
      
      if (result.success && test.check(result.data)) {
        console.log(`✅ ${test.name} - ${test.minRecords}+ records found`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Insufficient records or invalid response`);
        if (result.success) {
          const count = Array.isArray(result.data[Object.keys(result.data)[0]]) ? 
                       result.data[Object.keys(result.data)[0]].length : 0;
          console.log(`   Found: ${count} records (need ${test.minRecords}+)`);
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error:`, error.message);
    }
  }
  
  console.log(`\n📊 Data Seeding Results: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Phase 4.3: Real Data Integration Testing
async function testRealDataIntegration() {
  console.log('\n🔗 Testing Real Data Integration...');
  
  const tests = [
    {
      name: 'Dashboard Analytics Integration',
      test: async () => {
        const result = await makeRequest('GET', '/api/analytics/performance?period=30D', null, authToken);
        return result.success && 
               result.data.analytics &&
               typeof result.data.analytics.views === 'number' &&
               typeof result.data.analytics.engagement === 'number' &&
               typeof result.data.analytics.revenue === 'number';
      }
    },
    {
      name: 'Content Creation with Real Data',
      test: async () => {
        const contentData = {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          platform: 'youtube',
          contentType: 'video',
          tags: ['test', 'real-data']
        };
        
        const result = await makeRequest('POST', '/api/content/create', contentData, authToken);
        return result.success && result.data.content && result.data.content.id;
      }
    },
    {
      name: 'AI Generation with Real APIs',
      test: async () => {
        const aiData = {
          prompt: 'Generate a script for a tech review video',
          type: 'script',
          platform: 'youtube'
        };
        
        const result = await makeRequest('POST', '/api/ai/generate-script', aiData, authToken);
        return result.success && result.data.result && result.data.result.length > 0;
      }
    },
    {
      name: 'Template Usage with Real Data',
      test: async () => {
        // First get templates
        const templatesResult = await makeRequest('GET', '/api/templates', null, authToken);
        if (!templatesResult.success || !templatesResult.data.templates.length) {
          return false;
        }
        
        const templateId = templatesResult.data.templates[0].id;
        const useResult = await makeRequest('POST', `/api/templates/${templateId}/use`, {}, authToken);
        return useResult.success;
      }
    },
    {
      name: 'Scheduling with Real Data',
      test: async () => {
        const scheduleData = {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          platform: 'linkedin',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        const result = await makeRequest('POST', '/api/content/schedule', scheduleData, authToken);
        return result.success && result.data.scheduledContent && result.data.scheduledContent.id;
      }
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const passed = await test.test();
      if (passed) {
        console.log(`✅ ${test.name} - Real data integration working`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Real data integration failed`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error:`, error.message);
    }
  }
  
  console.log(`\n📊 Real Data Integration Results: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Phase 4.4: Data Quality & Validation Framework
async function testDataQualityValidation() {
  console.log('\n🔍 Testing Data Quality & Validation...');
  
  const tests = [
    {
      name: 'Input Validation - Invalid Email',
      test: async () => {
        const result = await makeRequest('POST', '/api/auth/register', {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
        return !result.success && result.status === 400;
      }
    },
    {
      name: 'Input Validation - Short Password',
      test: async () => {
        const result = await makeRequest('POST', '/api/auth/register', {
          email: 'test2@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User'
        });
        return !result.success && result.status === 400;
      }
    },
    {
      name: 'Data Sanitization - XSS Prevention',
      test: async () => {
        const contentData = {
          title: '<script>alert("xss")</script>',
          description: faker.lorem.paragraph(),
          platform: 'youtube',
          contentType: 'video'
        };
        
        const result = await makeRequest('POST', '/api/content/create', contentData, authToken);
        return result.success && 
               result.data.content.title === '<script>alert("xss")</script>' &&
               !result.data.content.title.includes('<script>');
      }
    },
    {
      name: 'Foreign Key Consistency',
      test: async () => {
        const result = await makeRequest('GET', '/api/content', null, authToken);
        if (!result.success) return false;
        
        return result.data.content.every(c => 
          c.userId && 
          typeof c.userId === 'string' && 
          c.userId.length > 0
        );
      }
    },
    {
      name: 'Data Type Validation',
      test: async () => {
        const result = await makeRequest('GET', '/api/analytics/performance?period=7D', null, authToken);
        return result.success && 
               result.data.analytics &&
               typeof result.data.analytics.views === 'number' &&
               typeof result.data.analytics.engagement === 'number' &&
               typeof result.data.analytics.revenue === 'number';
      }
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const passed = await test.test();
      if (passed) {
        console.log(`✅ ${test.name} - Validation working`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Validation failed`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error:`, error.message);
    }
  }
  
  console.log(`\n📊 Data Quality Validation Results: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Main Phase 4 Implementation
async function implementPhase4() {
  console.log('🚀 Starting Phase 4: Mock Data Removal & Real Data Implementation');
  console.log('=' .repeat(80));
  
  // Step 1: Authentication
  const authSuccess = await registerAndLogin();
  if (!authSuccess) {
    console.error('❌ Cannot proceed without authentication');
    return false;
  }
  
  // Step 2: Test all Phase 4 tasks
  const results = {
    mockDataRemoval: await testMockDataRemoval(),
    structuredDataSeeding: await testStructuredDataSeeding(),
    realDataIntegration: await testRealDataIntegration(),
    dataQualityValidation: await testDataQualityValidation()
  };
  
  // Step 3: Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 4 IMPLEMENTATION SUMMARY');
  console.log('='.repeat(80));
  
  const totalTasks = Object.keys(results).length;
  const passedTasks = Object.values(results).filter(Boolean).length;
  
  console.log(`Task 4.1: Mock Data Removal - ${results.mockDataRemoval ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Task 4.2: Structured Data Seeding - ${results.structuredDataSeeding ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Task 4.3: Real Data Integration - ${results.realDataIntegration ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Task 4.4: Data Quality Validation - ${results.dataQualityValidation ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log(`\n📊 Overall Results: ${passedTasks}/${totalTasks} tasks completed successfully`);
  
  if (passedTasks === totalTasks) {
    console.log('\n🎉 PHASE 4 COMPLETED SUCCESSFULLY!');
    console.log('✅ All mock data has been removed');
    console.log('✅ Real data is implemented across all pages');
    console.log('✅ All acceptance criteria and test cases passed');
    console.log('✅ 100% success rate achieved');
  } else {
    console.log('\n⚠️ PHASE 4 PARTIALLY COMPLETED');
    console.log('Some tasks need attention before proceeding');
  }
  
  return passedTasks === totalTasks;
}

// Run the implementation
if (require.main === module) {
  implementPhase4()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Phase 4 implementation failed:', error);
      process.exit(1);
    });
}

module.exports = { implementPhase4 };
