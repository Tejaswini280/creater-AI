#!/usr/bin/env node

/**
 * JWT Issue Diagnostic Script
 * Checks JWT configuration and identifies issues
 */

const jwt = require('jsonwebtoken');

console.log('🔍 JWT Configuration Diagnostic\n');
console.log('=' .repeat(60));

// Test different expiry values
const testCases = [
  { value: '15m', expected: 'valid', description: '15 minutes' },
  { value: '7d', expected: 'valid', description: '7 days' },
  { value: '1h', expected: 'valid', description: '1 hour' },
  { value: '3600', expected: 'valid', description: '3600 seconds' },
  { value: '', expected: 'invalid', description: 'empty string' },
  { value: undefined, expected: 'invalid', description: 'undefined' },
  { value: null, expected: 'invalid', description: 'null' },
  { value: 'undefined', expected: 'invalid', description: 'string "undefined"' },
  { value: 'null', expected: 'invalid', description: 'string "null"' },
  { value: '  ', expected: 'invalid', description: 'whitespace only' },
];

console.log('\n📋 Testing JWT expiresIn values:\n');

const testSecret = 'test-secret-key';
const testPayload = { userId: 'test-123', email: 'test@example.com' };

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Value: ${JSON.stringify(testCase.value)}`);
  
  try {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: testCase.value });
    const decoded = jwt.verify(token, testSecret);
    
    console.log(`  ✅ Result: VALID - Token generated successfully`);
    console.log(`  Token expires at: ${new Date(decoded.exp * 1000).toISOString()}`);
  } catch (error) {
    console.log(`  ❌ Result: INVALID - ${error.message}`);
  }
  console.log('');
});

console.log('=' .repeat(60));

// Check environment variables
console.log('\n🔍 Environment Variables Check:\n');

const envVars = [
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = varName.includes('SECRET') && value ? '***SET***' : (value || 'NOT SET');
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n' + '='.repeat(60));

// Validation function test
console.log('\n🧪 Testing Validation Function:\n');

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

const validationTests = [
  { input: process.env.ACCESS_TOKEN_EXPIRY, default: '15m', name: 'ACCESS_TOKEN_EXPIRY' },
  { input: process.env.JWT_EXPIRES_IN, default: '15m', name: 'JWT_EXPIRES_IN' },
  { input: '', default: '15m', name: 'empty string' },
  { input: undefined, default: '15m', name: 'undefined' },
  { input: 'invalid-format', default: '15m', name: 'invalid format' },
];

validationTests.forEach(test => {
  console.log(`Testing: ${test.name}`);
  console.log(`  Input: ${JSON.stringify(test.input)}`);
  const result = validateTokenExpiry(test.input, test.default);
  console.log(`  Output: ${result}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log('\n✅ Diagnostic complete!\n');

// Recommendations
console.log('📝 Recommendations:\n');
console.log('1. Ensure ACCESS_TOKEN_EXPIRY is set to "15m" in Railway');
console.log('2. Ensure REFRESH_TOKEN_EXPIRY is set to "7d" in Railway');
console.log('3. Ensure JWT_SECRET is set to a strong random value');
console.log('4. Redeploy after setting environment variables');
console.log('\nRun: railway variables --set ACCESS_TOKEN_EXPIRY=15m --service creator-dev-server-staging');
console.log('Run: railway variables --set REFRESH_TOKEN_EXPIRY=7d --service creator-dev-server-staging\n');
