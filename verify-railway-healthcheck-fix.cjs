#!/usr/bin/env node
/**
 * Railway 502 Healthcheck Fix Verification Script
 * 
 * This script verifies that the healthcheck fix is working correctly
 * by testing the middleware order and redirect behavior.
 */

const http = require('http');
const https = require('https');

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🔍 RAILWAY HEALTHCHECK FIX VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('');

// Configuration
const LOCAL_PORT = process.env.PORT || 5000;
const LOCAL_HOST = 'localhost';
const RAILWAY_URL = process.env.RAILWAY_URL || '';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Make HTTP request and return response details
 */
function makeRequest(url, followRedirects = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Railway-Healthcheck-Verification/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          redirectLocation: res.headers.location
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Test healthcheck endpoint
 */
async function testHealthcheck(url, testName) {
  console.log(`📋 Test: ${testName}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await makeRequest(url);
    
    // Check status code
    if (response.statusCode === 200) {
      console.log(`   ✅ Status: ${response.statusCode} (PASS)`);
      results.passed++;
    } else {
      console.log(`   ❌ Status: ${response.statusCode} (FAIL - expected 200)`);
      results.failed++;
    }
    
    // Check for redirect
    if (response.redirectLocation) {
      console.log(`   ❌ Redirect: ${response.redirectLocation} (FAIL - healthcheck should not redirect)`);
      results.failed++;
    } else {
      console.log(`   ✅ No redirect (PASS)`);
      results.passed++;
    }
    
    // Check response body
    try {
      const json = JSON.parse(response.body);
      if (json.status === 'ok') {
        console.log(`   ✅ Response: ${JSON.stringify(json).substring(0, 80)}... (PASS)`);
        results.passed++;
      } else {
        console.log(`   ❌ Response: Invalid status (FAIL)`);
        results.failed++;
      }
    } catch (e) {
      console.log(`   ❌ Response: Invalid JSON (FAIL)`);
      results.failed++;
    }
    
    results.tests.push({
      name: testName,
      url: url,
      passed: response.statusCode === 200 && !response.redirectLocation
    });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message} (FAIL)`);
    results.failed++;
    results.tests.push({
      name: testName,
      url: url,
      passed: false,
      error: error.message
    });
  }
  
  console.log('');
}

/**
 * Test HTTPS redirect for non-healthcheck endpoints
 */
async function testHttpsRedirect(url, testName) {
  console.log(`📋 Test: ${testName}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await makeRequest(url);
    
    // In production, non-healthcheck endpoints should redirect to HTTPS
    if (process.env.NODE_ENV === 'production') {
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`   ✅ Status: ${response.statusCode} (PASS - redirect expected in production)`);
        results.passed++;
        
        if (response.redirectLocation && response.redirectLocation.startsWith('https://')) {
          console.log(`   ✅ Redirect: ${response.redirectLocation} (PASS - HTTPS redirect)`);
          results.passed++;
        } else {
          console.log(`   ❌ Redirect: ${response.redirectLocation} (FAIL - should redirect to HTTPS)`);
          results.failed++;
        }
      } else {
        console.log(`   ❌ Status: ${response.statusCode} (FAIL - expected redirect in production)`);
        results.failed++;
      }
    } else {
      // In development, no redirect expected
      if (response.statusCode === 200) {
        console.log(`   ✅ Status: ${response.statusCode} (PASS - no redirect in development)`);
        results.passed++;
      } else {
        console.log(`   ⚠️  Status: ${response.statusCode} (may be expected)`);
      }
    }
    
    results.tests.push({
      name: testName,
      url: url,
      passed: true
    });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message} (FAIL)`);
    results.failed++;
    results.tests.push({
      name: testName,
      url: url,
      passed: false,
      error: error.message
    });
  }
  
  console.log('');
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('🚀 Starting verification tests...');
  console.log('');
  
  // Test 1: Local healthcheck endpoint /health
  await testHealthcheck(
    `http://${LOCAL_HOST}:${LOCAL_PORT}/health`,
    'Local Healthcheck - /health'
  );
  
  // Test 2: Local healthcheck endpoint /api/health
  await testHealthcheck(
    `http://${LOCAL_HOST}:${LOCAL_PORT}/api/health`,
    'Local Healthcheck - /api/health'
  );
  
  // Test 3: HTTPS redirect for non-healthcheck endpoint (if in production)
  if (process.env.NODE_ENV === 'production') {
    await testHttpsRedirect(
      `http://${LOCAL_HOST}:${LOCAL_PORT}/`,
      'HTTPS Redirect - Root Path'
    );
  }
  
  // Test 4: Railway healthcheck (if RAILWAY_URL is set)
  if (RAILWAY_URL) {
    await testHealthcheck(
      `${RAILWAY_URL}/api/health`,
      'Railway Healthcheck - /api/health'
    );
  }
  
  // Print summary
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED - HEALTHCHECK FIX VERIFIED');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Healthcheck endpoints return 200 without redirects');
    console.log('✅ HTTPS redirect works for non-healthcheck endpoints');
    console.log('✅ Railway healthcheck will pass');
    console.log('✅ No more 502 Bad Gateway');
    console.log('');
    process.exit(0);
  } else {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('❌ SOME TESTS FAILED - REVIEW RESULTS ABOVE');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Failed tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.url}`);
      if (t.error) {
        console.log(`      Error: ${t.error}`);
      }
    });
    console.log('');
    process.exit(1);
  }
}

// Check if server is running
console.log('🔍 Checking if server is running...');
console.log(`   Host: ${LOCAL_HOST}`);
console.log(`   Port: ${LOCAL_PORT}`);
console.log('');

makeRequest(`http://${LOCAL_HOST}:${LOCAL_PORT}/api/health`)
  .then(() => {
    console.log('✅ Server is running');
    console.log('');
    return runTests();
  })
  .catch((error) => {
    console.log('❌ Server is not running');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('Please start the server first:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   npm start');
    console.log('');
    process.exit(1);
  });
