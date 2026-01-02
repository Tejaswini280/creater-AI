#!/usr/bin/env node

/**
 * Comprehensive CreatorNexus Functionality Test
 * Tests all pages, API endpoints, and database functionality
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@creatornexus.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;
let testResults = {
  pages: {},
  api: {},
  database: {},
  features: {}
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Test page accessibility
async function testPage(path, pageName) {
  console.log(`Testing page: ${pageName} (${path})`);
  
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const isAccessible = response.ok;
    const status = response.status;
    
    testResults.pages[pageName] = {
      path,
      accessible: isAccessible,
      status,
      working: isAccessible && status === 200
    };
    
    console.log(`  ✅ ${pageName}: ${isAccessible ? 'ACCESSIBLE' : 'FAILED'} (${status})`);
    return isAccessible;
  } catch (error) {
    testResults.pages[pageName] = {
      path,
      accessible: false,
      status: 0,
      error: error.message,
      working: false
    };
    console.log(`  ❌ ${pageName}: ERROR - ${error.message}`);
    return false;
  }
}

// Test API endpoint
async function testApiEndpoint(endpoint, method = 'GET', data = null, description = '') {
  console.log(`Testing API: ${method} ${endpoint} - ${description}`);
  
  const options = {
    method,
    ...(data && { body: JSON.stringify(data) })
  };
  
  const result = await apiRequest(endpoint, options);
  
  testResults.api[`${method} ${endpoint}`] = {
    description,
    working: result.ok,
    status: result.status,
    error: result.error
  };
  
  console.log(`  ${result.ok ? '✅' : '❌'} ${method} ${endpoint}: ${result.ok ? 'WORKING' : 'FAILED'} (${result.status})`);
  if (result.error) {
    console.log(`    Error: ${result.error}`);
  }
  
  return result;
}

// Test database connectivity
async function testDatabase() {
  console.log('\n🗄️  Testing Database Connectivity...');
  
  try {
    // Test basic database connection through API
    const result = await testApiEndpoint('/api/dashboard/metrics', 'GET', null, 'Database connectivity test');
    
    testResults.database.connectivity = {
      working: result.status !== 500,
      status: result.status,
      error: result.error
    };
    
    return result.status !== 500;
  } catch (error) {
    testResults.database.connectivity = {
      working: false,
      error: error.message
    };
    console.log(`  ❌ Database connectivity: ERROR - ${error.message}`);
    return false;
  }
}

// Test authentication flow
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test registration
  const registerResult = await testApiEndpoint('/api/auth/register', 'POST', TEST_USER, 'User registration');
  
  // Test login
  const loginResult = await testApiEndpoint('/api/auth/login', 'POST', {
    email: TEST_USER.email,
    password: TEST_USER.password
  }, 'User login');
  
  if (loginResult.ok && loginResult.data?.accessToken) {
    authToken = loginResult.data.accessToken;
    console.log('  ✅ Authentication token obtained');
    
    // Test authenticated endpoint
    await testApiEndpoint('/api/auth/me', 'GET', null, 'Get current user');
    
    testResults.features.authentication = {
      working: true,
      hasToken: true
    };
    
    return true;
  } else {
    console.log('  ❌ Failed to obtain authentication token');
    testResults.features.authentication = {
      working: false,
      hasToken: false,
      error: loginResult.error
    };
    return false;
  }
}

// Test core features
async function testCoreFeatures() {
  console.log('\n🚀 Testing Core Features...');
  
  if (!authToken) {
    console.log('  ⚠️  Skipping feature tests - no authentication token');
    return;
  }
  
  // Test content management
  const contentResult = await testApiEndpoint('/api/content', 'GET', null, 'List content');
  testResults.features.contentManagement = { working: contentResult.ok };
  
  // Test project management
  const projectsResult = await testApiEndpoint('/api/projects', 'GET', null, 'List projects');
  testResults.features.projectManagement = { working: projectsResult.ok };
  
  // Test analytics
  const analyticsResult = await testApiEndpoint('/api/analytics/dashboard', 'GET', null, 'Analytics dashboard');
  testResults.features.analytics = { working: analyticsResult.ok };
  
  // Test scheduler
  const schedulerResult = await testApiEndpoint('/api/scheduler', 'GET', null, 'Scheduler');
  testResults.features.scheduler = { working: schedulerResult.ok };
  
  // Test templates
  const templatesResult = await testApiEndpoint('/api/templates', 'GET', null, 'Templates');
  testResults.features.templates = { working: templatesResult.ok };
  
  // Test AI generation
  const aiResult = await testApiEndpoint('/api/ai/content-ideas', 'POST', {
    niche: 'technology',
    platform: 'youtube',
    count: 5
  }, 'AI content generation');
  testResults.features.aiGeneration = { working: aiResult.ok };
  
  // Test social media
  const socialResult = await testApiEndpoint('/api/social-media/accounts', 'GET', null, 'Social media accounts');
  testResults.features.socialMedia = { working: socialResult.ok };
}

// Test all pages
async function testAllPages() {
  console.log('\n📄 Testing Page Accessibility...');
  
  const pages = [
    ['/', 'Landing/Dashboard'],
    ['/login', 'Login'],
    ['/content-studio', 'Content Studio'],
    ['/analytics', 'Analytics'],
    ['/scheduler', 'Scheduler'],
    ['/enhanced-scheduler', 'Enhanced Scheduler'],
    ['/templates', 'Templates'],
    ['/ai-generator', 'AI Generator'],
    ['/youtube', 'YouTube Integration'],
    ['/linkedin', 'LinkedIn Integration'],
    ['/gemini-studio', 'Gemini Studio'],
    ['/notifications', 'Notifications'],
    ['/assets', 'Assets'],
    ['/recorder', 'Recorder'],
    ['/new-project', 'New Project'],
    ['/new-project-enhanced', 'Enhanced New Project'],
    ['/social-media', 'Social Media Dashboard'],
    ['/recent-content', 'Recent Content'],
    ['/websocket-test', 'WebSocket Test'],
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Service'],
    ['/docs', 'Documentation'],
    ['/faq', 'FAQ'],
    ['/api-docs', 'API Documentation'],
    ['/tutorials', 'Tutorials'],
    ['/troubleshooting', 'Troubleshooting']
  ];
  
  for (const [path, name] of pages) {
    await testPage(path, name);
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📊 COMPREHENSIVE FUNCTIONALITY REPORT');
  console.log('=====================================\n');
  
  // Page Status Summary
  console.log('📄 PAGE STATUS SUMMARY:');
  const workingPages = Object.values(testResults.pages).filter(p => p.working).length;
  const totalPages = Object.keys(testResults.pages).length;
  console.log(`   Working: ${workingPages}/${totalPages} pages\n`);
  
  Object.entries(testResults.pages).forEach(([name, result]) => {
    const status = result.working ? '✅ WORKING' : '❌ FAILED';
    console.log(`   ${status} - ${name} (${result.path}) - Status: ${result.status}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // API Status Summary
  console.log('\n🔌 API ENDPOINT STATUS:');
  const workingApis = Object.values(testResults.api).filter(a => a.working).length;
  const totalApis = Object.keys(testResults.api).length;
  console.log(`   Working: ${workingApis}/${totalApis} endpoints\n`);
  
  Object.entries(testResults.api).forEach(([endpoint, result]) => {
    const status = result.working ? '✅ WORKING' : '❌ FAILED';
    console.log(`   ${status} - ${endpoint} - ${result.description} (${result.status})`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // Feature Status Summary
  console.log('\n🚀 FEATURE STATUS:');
  Object.entries(testResults.features).forEach(([feature, result]) => {
    const status = result.working ? '✅ WORKING' : '❌ FAILED';
    console.log(`   ${status} - ${feature}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // Database Status
  console.log('\n🗄️  DATABASE STATUS:');
  if (testResults.database.connectivity) {
    const status = testResults.database.connectivity.working ? '✅ WORKING' : '❌ FAILED';
    console.log(`   ${status} - Database Connectivity`);
    if (testResults.database.connectivity.error) {
      console.log(`     Error: ${testResults.database.connectivity.error}`);
    }
  }
  
  // Overall Health Score
  const totalTests = workingPages + workingApis + Object.values(testResults.features).filter(f => f.working).length;
  const maxTests = totalPages + totalApis + Object.keys(testResults.features).length;
  const healthScore = Math.round((totalTests / maxTests) * 100);
  
  console.log('\n🎯 OVERALL HEALTH SCORE:');
  console.log(`   ${healthScore}% (${totalTests}/${maxTests} components working)`);
  
  if (healthScore >= 90) {
    console.log('   🟢 EXCELLENT - System is highly functional');
  } else if (healthScore >= 70) {
    console.log('   🟡 GOOD - System is mostly functional with minor issues');
  } else if (healthScore >= 50) {
    console.log('   🟠 FAIR - System has significant issues that need attention');
  } else {
    console.log('   🔴 POOR - System has critical issues requiring immediate attention');
  }
  
  // Critical Issues
  console.log('\n⚠️  CRITICAL ISSUES IDENTIFIED:');
  const failedPages = Object.entries(testResults.pages).filter(([_, result]) => !result.working);
  const failedApis = Object.entries(testResults.api).filter(([_, result]) => !result.working);
  const failedFeatures = Object.entries(testResults.features).filter(([_, result]) => !result.working);
  
  if (failedPages.length > 0) {
    console.log('   📄 Failed Pages:');
    failedPages.forEach(([name, result]) => {
      console.log(`     - ${name}: ${result.error || 'Unknown error'}`);
    });
  }
  
  if (failedApis.length > 0) {
    console.log('   🔌 Failed API Endpoints:');
    failedApis.forEach(([endpoint, result]) => {
      console.log(`     - ${endpoint}: ${result.error || 'Unknown error'}`);
    });
  }
  
  if (failedFeatures.length > 0) {
    console.log('   🚀 Failed Features:');
    failedFeatures.forEach(([feature, result]) => {
      console.log(`     - ${feature}: ${result.error || 'Unknown error'}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (!testResults.database.connectivity?.working) {
    console.log('   1. 🔴 CRITICAL: Fix database connectivity issues');
  }
  
  if (!testResults.features.authentication?.working) {
    console.log('   2. 🔴 CRITICAL: Fix authentication system');
  }
  
  if (failedPages.length > 5) {
    console.log('   3. 🟠 HIGH: Multiple pages are inaccessible - check routing configuration');
  }
  
  if (failedApis.length > 5) {
    console.log('   4. 🟠 HIGH: Multiple API endpoints failing - check server configuration');
  }
  
  if (healthScore < 70) {
    console.log('   5. 🟡 MEDIUM: Overall system health is below acceptable threshold');
  }
  
  console.log('\n📝 DETAILED RESULTS SAVED TO: comprehensive-test-results.json');
  
  // Save detailed results to file
  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(testResults, null, 2));
}

// Main test execution
async function runComprehensiveTest() {
  console.log('🧪 STARTING COMPREHENSIVE CREATORNEXUS FUNCTIONALITY TEST');
  console.log('========================================================\n');
  
  console.log('⏳ Waiting for server to be ready...');
  
  // Wait for server to be ready
  let serverReady = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!serverReady && attempts < maxAttempts) {
    try {
      const response = await fetch(BASE_URL);
      if (response.status === 200 || response.status === 404) {
        serverReady = true;
        console.log('✅ Server is ready!\n');
      }
    } catch (error) {
      attempts++;
      console.log(`   Attempt ${attempts}/${maxAttempts} - Server not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!serverReady) {
    console.log('❌ Server failed to start within timeout period');
    process.exit(1);
  }
  
  // Run all tests
  await testDatabase();
  await testAuthentication();
  await testAllPages();
  await testCoreFeatures();
  
  // Generate comprehensive report
  generateReport();
  
  console.log('\n✅ COMPREHENSIVE TEST COMPLETED');
}

// Run the test
runComprehensiveTest().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});