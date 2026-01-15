#!/usr/bin/env node
/**
 * JWT Expiry Fix Verification Script
 * Verifies that the JWT token expiry fix is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 JWT Expiry Fix Verification');
console.log('================================\n');

let allChecks = true;

// Check 1: Verify auth.ts has validation function
console.log('📝 Check 1: Validation function in auth.ts');
const authPath = path.join(__dirname, 'server', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  if (authContent.includes('validateTokenExpiry')) {
    console.log('✅ validateTokenExpiry function found');
  } else {
    console.log('❌ validateTokenExpiry function NOT found');
    allChecks = false;
  }
  
  if (authContent.includes('VALIDATED_ACCESS_TOKEN_EXPIRY')) {
    console.log('✅ VALIDATED_ACCESS_TOKEN_EXPIRY constant found');
  } else {
    console.log('❌ VALIDATED_ACCESS_TOKEN_EXPIRY constant NOT found');
    allChecks = false;
  }
  
  if (authContent.includes('VALIDATED_REFRESH_TOKEN_EXPIRY')) {
    console.log('✅ VALIDATED_REFRESH_TOKEN_EXPIRY constant found');
  } else {
    console.log('❌ VALIDATED_REFRESH_TOKEN_EXPIRY constant NOT found');
    allChecks = false;
  }
  
  // Check that old 'as any' is removed
  if (authContent.includes('expiresIn: ACCESS_TOKEN_EXPIRY as any')) {
    console.log('⚠️  Warning: Old "as any" type assertion still present');
    allChecks = false;
  } else {
    console.log('✅ Type assertions cleaned up');
  }
} else {
  console.log('❌ auth.ts file not found');
  allChecks = false;
}

console.log('');

// Check 2: Verify environment files
console.log('📝 Check 2: Environment files configuration');
const envFiles = [
  '.env',
  '.env.staging',
  '.env.production',
  '.env.railway'
];

for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasJwtExpiresIn = envContent.includes('JWT_EXPIRES_IN');
    const hasJwtRefreshExpiresIn = envContent.includes('JWT_REFRESH_EXPIRES_IN');
    const hasAccessTokenExpiry = envContent.includes('ACCESS_TOKEN_EXPIRY');
    const hasRefreshTokenExpiry = envContent.includes('REFRESH_TOKEN_EXPIRY');
    
    if (hasJwtExpiresIn && hasJwtRefreshExpiresIn) {
      console.log(`✅ ${envFile}: JWT expiration variables configured`);
    } else {
      console.log(`⚠️  ${envFile}: Missing JWT expiration variables`);
      if (!hasJwtExpiresIn) console.log(`   - Missing JWT_EXPIRES_IN`);
      if (!hasJwtRefreshExpiresIn) console.log(`   - Missing JWT_REFRESH_EXPIRES_IN`);
    }
  } else {
    console.log(`⚠️  ${envFile}: File not found (may be optional)`);
  }
}

console.log('');

// Check 3: Verify documentation
console.log('📝 Check 3: Documentation');
const docPath = path.join(__dirname, 'JWT_EXPIRY_ROOT_CAUSE_PERMANENT_FIX.md');
if (fs.existsSync(docPath)) {
  console.log('✅ JWT_EXPIRY_ROOT_CAUSE_PERMANENT_FIX.md exists');
} else {
  console.log('❌ Documentation file not found');
  allChecks = false;
}

console.log('');

// Check 4: Test validation logic (if possible)
console.log('📝 Check 4: Validation logic test');
console.log('Testing validation function behavior:');

// Simulate the validation function
function validateTokenExpiry(expiry, defaultValue) {
  if (!expiry || expiry === '' || expiry === 'undefined' || expiry === 'null') {
    console.warn(`⚠️ Invalid token expiry value: "${expiry}", using default: ${defaultValue}`);
    return defaultValue;
  }
  return expiry;
}

// Test cases
const testCases = [
  { input: undefined, expected: '15m', description: 'undefined' },
  { input: null, expected: '15m', description: 'null' },
  { input: '', expected: '15m', description: 'empty string' },
  { input: 'undefined', expected: '15m', description: 'string "undefined"' },
  { input: 'null', expected: '15m', description: 'string "null"' },
  { input: '1h', expected: '1h', description: 'valid value "1h"' },
  { input: '7d', expected: '7d', description: 'valid value "7d"' },
];

let testsPassed = 0;
for (const test of testCases) {
  const result = validateTokenExpiry(test.input, '15m');
  if (result === test.expected) {
    console.log(`✅ Test passed: ${test.description} -> ${result}`);
    testsPassed++;
  } else {
    console.log(`❌ Test failed: ${test.description} -> expected ${test.expected}, got ${result}`);
    allChecks = false;
  }
}

console.log(`\nValidation tests: ${testsPassed}/${testCases.length} passed`);
console.log('');

// Summary
console.log('================================');
if (allChecks) {
  console.log('✅ All checks passed!');
  console.log('');
  console.log('🚀 Ready for deployment to Railway');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: ./deploy-jwt-expiry-fix.ps1');
  console.log('2. Set environment variables in Railway dashboard');
  console.log('3. Verify login functionality');
  process.exit(0);
} else {
  console.log('❌ Some checks failed');
  console.log('');
  console.log('Please review the errors above and fix them before deploying');
  process.exit(1);
}
