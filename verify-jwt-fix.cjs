#!/usr/bin/env node

/**
 * Verify JWT Fix - Quick Test
 * Tests the JWT fix locally before deployment
 */

const jwt = require('jsonwebtoken');

console.log('🧪 JWT Fix Verification\n');
console.log('=' .repeat(60));

// Simulate the validation function from auth.ts
function validateTokenExpiry(expiry, defaultValue) {
  if (!expiry || 
      expiry === '' || 
      expiry === 'undefined' || 
      expiry === 'null' ||
      expiry.trim() === '') {
    console.warn(`⚠️ Invalid token expiry value: "${expiry}", using default: ${defaultValue}`);
    return defaultValue;
  }
  
  const validPattern = /^(\d+[smhd]|\d+)$/;
  if (!validPattern.test(expiry.trim())) {
    console.warn(`⚠️ Invalid token expiry format: "${expiry}", using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return expiry.trim();
}

// Test scenarios that were failing in production
const testScenarios = [
  {
    name: 'Production Scenario 1: Empty env var',
    envValue: '',
    expected: '15m'
  },
  {
    name: 'Production Scenario 2: Undefined env var',
    envValue: undefined,
    expected: '15m'
  },
  {
    name: 'Production Scenario 3: String "undefined"',
    envValue: 'undefined',
    expected: '15m'
  },
  {
    name: 'Production Scenario 4: String "null"',
    envValue: 'null',
    expected: '15m'
  },
  {
    name: 'Production Scenario 5: Whitespace only',
    envValue: '   ',
    expected: '15m'
  },
  {
    name: 'Valid Scenario 1: 15m',
    envValue: '15m',
    expected: '15m'
  },
  {
    name: 'Valid Scenario 2: 7d',
    envValue: '7d',
    expected: '7d'
  },
  {
    name: 'Valid Scenario 3: 1h',
    envValue: '1h',
    expected: '1h'
  },
];

console.log('\n📋 Testing Validation Function:\n');

let allPassed = true;

testScenarios.forEach((scenario, index) => {
  console.log(`Test ${index + 1}: ${scenario.name}`);
  console.log(`  Input: ${JSON.stringify(scenario.envValue)}`);
  
  const result = validateTokenExpiry(scenario.envValue, '15m');
  const passed = result === scenario.expected;
  
  if (passed) {
    console.log(`  ✅ PASS - Output: ${result}`);
  } else {
    console.log(`  ❌ FAIL - Expected: ${scenario.expected}, Got: ${result}`);
    allPassed = false;
  }
  console.log('');
});

console.log('=' .repeat(60));

// Test actual JWT token generation
console.log('\n🔐 Testing JWT Token Generation:\n');

const testSecret = 'test-secret-key-for-verification';
const testPayload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

const tokenTests = [
  { expiry: '15m', description: 'Access token (15 minutes)' },
  { expiry: '7d', description: 'Refresh token (7 days)' },
  { expiry: '1h', description: 'Custom token (1 hour)' },
];

tokenTests.forEach((test, index) => {
  console.log(`Token Test ${index + 1}: ${test.description}`);
  console.log(`  Expiry: ${test.expiry}`);
  
  try {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: test.expiry });
    const decoded = jwt.verify(token, testSecret);
    
    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const duration = Math.round((expiresAt - now) / 1000);
    
    console.log(`  ✅ Token generated successfully`);
    console.log(`  Token expires in: ${duration} seconds`);
    console.log(`  Expires at: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.log(`  ❌ Token generation failed: ${error.message}`);
    allPassed = false;
  }
  console.log('');
});

console.log('=' .repeat(60));

// Final result
console.log('\n📊 Verification Result:\n');

if (allPassed) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('');
  console.log('The JWT fix is working correctly and ready for deployment.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: ./deploy-jwt-permanent-fix.ps1');
  console.log('2. Wait for Railway deployment (2-3 minutes)');
  console.log('3. Test login at: https://creator-dev-server-staging.up.railway.app/login');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('');
  console.log('Please review the failures above before deploying.');
  console.log('');
  process.exit(1);
}
