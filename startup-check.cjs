#!/usr/bin/env node

/**
 * Startup environment check
 * Validates required environment variables before starting the application
 */

const requiredVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'JWT_SECRET'
];

const optionalVars = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY'
];

console.log('🔍 Environment Variables Check');
console.log('==============================');

let hasErrors = false;

// Check required variables
console.log('\n📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: SET`);
  }
});

// Check optional variables (warn but don't fail)
console.log('\n🔧 Optional Variables (AI Features):');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.length < 20) {
    console.log(`⚠️  ${varName}: NOT SET (AI features will be disabled)`);
  } else {
    console.log(`✅ ${varName}: SET`);
  }
});

if (hasErrors) {
  console.log('\n❌ STARTUP FAILED: Missing required environment variables');
  console.log('\nFor Railway deployment:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Navigate to Variables tab');
  console.log('3. Set the missing environment variables');
  console.log('4. Redeploy your application');
  process.exit(1);
} else {
  console.log('\n✅ Environment check passed - starting application...');
}
