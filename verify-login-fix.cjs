#!/usr/bin/env node

/**
 * VERIFY LOGIN FIX
 * 
 * This script verifies that the login fix has been applied correctly
 * Run after deployment to confirm everything is working
 */

const https = require('https');
const http = require('http');

const STAGING_URL = 'https://creator-dev-server-staging.up.railway.app';
const TEST_EMAIL = 'tgaswini.kawade@renalssa.ai';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test_password';

console.log('🔍 VERIFYING LOGIN FIX');
console.log('='.repeat(70));
console.log('');

async function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('📋 TEST 1: Health Check');
  console.log('-'.repeat(70));
  
  try {
    const response = await makeRequest(`${STAGING_URL}/api/health`, {
      method: 'GET'
    });

    if (response.status === 200) {
      console.log('✅ Health check passed');
      const data = JSON.parse(response.body);
      console.log('   Status:', data.status);
      console.log('   Environment:', data.environment);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('   Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testLoginEndpoint() {
  console.log('');
  console.log('📋 TEST 2: Login Endpoint');
  console.log('-'.repeat(70));
  
  try {
    const payload = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const response = await makeRequest(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    console.log('   Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
      const data = JSON.parse(response.body);
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
      console.log('   Has Access Token:', !!data.accessToken);
      console.log('   Has Refresh Token:', !!data.refreshToken);
      return true;
    } else if (response.status === 401) {
      const data = JSON.parse(response.body);
      console.log('⚠️  Login failed (expected if password is wrong)');
      console.log('   Message:', data.message);
      
      if (data.message.includes('OAuth')) {
        console.log('ℹ️  This is an OAuth user - fix is working correctly!');
        return true;
      } else if (data.message.includes('Invalid credentials')) {
        console.log('ℹ️  Invalid credentials - fix is working, but password is wrong');
        console.log('   Try setting TEST_PASSWORD environment variable');
        return true;
      }
      return false;
    } else if (response.status === 500) {
      console.log('❌ Login still returning 500 error!');
      console.log('   Response:', response.body);
      return false;
    } else {
      console.log('⚠️  Unexpected status code');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Login test error:', error.message);
    return false;
  }
}

async function testInvalidLogin() {
  console.log('');
  console.log('📋 TEST 3: Invalid Login (Error Handling)');
  console.log('-'.repeat(70));
  
  try {
    const payload = JSON.stringify({
      email: 'nonexistent@example.com',
      password: 'wrong_password'
    });

    const response = await makeRequest(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    if (response.status === 401) {
      console.log('✅ Invalid login handled correctly');
      const data = JSON.parse(response.body);
      console.log('   Message:', data.message);
      return true;
    } else if (response.status === 500) {
      console.log('❌ Still returning 500 for invalid login!');
      return false;
    } else {
      console.log('⚠️  Unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid login test error:', error.message);
    return false;
  }
}

async function runVerification() {
  console.log('Target:', STAGING_URL);
  console.log('Test Email:', TEST_EMAIL);
  console.log('');

  const results = {
    health: await testHealthEndpoint(),
    login: await testLoginEndpoint(),
    errorHandling: await testInvalidLogin()
  };

  console.log('');
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(70));
  console.log('');
  console.log('Health Check:     ', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Login Endpoint:   ', results.login ? '✅ PASS' : '❌ FAIL');
  console.log('Error Handling:   ', results.errorHandling ? '✅ PASS' : '❌ FAIL');
  console.log('');

  const allPassed = results.health && results.login && results.errorHandling;

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - LOGIN FIX VERIFIED!');
    console.log('');
    console.log('🎉 The login 500 error has been successfully fixed!');
    console.log('');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check Railway logs for detailed errors');
    console.log('2. Verify database migration ran successfully');
    console.log('3. Confirm column is named "password" not "password_hash"');
    console.log('4. Run: node diagnose-login-500-error.cjs');
    console.log('');
  }

  process.exit(allPassed ? 0 : 1);
}

runVerification().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
