/**
 * Quick Validation Script for Enhanced New Project Implementation
 * Checks if the basic endpoints are responding correctly
 */

const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

async function validateEndpoint(name, method, endpoint, expectedStatus = 200) {
  try {
    console.log(`🔍 Testing ${name}...`);

    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000
    });

    if (response.status === expectedStatus) {
      console.log(`✅ ${name}: ${response.status} - OK`);
      return true;
    } else {
      console.log(`⚠️  ${name}: Expected ${expectedStatus}, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.code || error.message}`);
    return false;
  }
}

async function validateEnhancedProject() {
  console.log('🚀 Validating Enhanced New Project Implementation');
  console.log('=' .repeat(60));

  const tests = [
    // Basic endpoints
    ['Server Health', 'GET', '/api/test/simple'],
    ['Projects List', 'GET', '/api/projects'],
    ['AI Enhancement', 'POST', '/api/ai/enhance-content', 400], // Should fail without auth/data

    // Enhanced endpoints (may require auth)
    ['Enhanced Projects', 'POST', '/api/projects/enhanced', 401],
    ['AI Calendar', 'POST', '/api/projects/1/ai-calendar', 401],
    ['Project Dashboard', 'GET', '/api/projects/1/dashboard', 401],
    ['Integration Setup', 'POST', '/api/projects/1/integrations', 401]
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, method, endpoint, expectedStatus = 200] of tests) {
    const success = await validateEndpoint(name, method, endpoint, expectedStatus);
    if (success) passed++;
    else failed++;
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎯 All basic validations passed! The enhanced implementation is ready for testing.');
  } else {
    console.log('\n⚠️  Some validations failed. Please check the server logs and ensure all routes are properly configured.');
  }

  return failed === 0;
}

// Run validation
validateEnhancedProject().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Validation crashed:', error);
  process.exit(1);
});
