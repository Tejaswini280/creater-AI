#!/usr/bin/env node

/**
 * Environment Validation Script
 * Checks if all required environment variables are properly set
 */

console.log('🔍 Environment Validation');
console.log('=========================');

const environment = process.env.NODE_ENV || 'development';
console.log(`Environment: ${environment}`);

// Define validation rules
const validationRules = {
  required: [
    { name: 'DATABASE_URL', description: 'Database connection string' },
    { name: 'SESSION_SECRET', description: 'Session encryption secret', minLength: 32 },
    { name: 'JWT_SECRET', description: 'JWT signing secret', minLength: 32 }
  ],
  optional: [
    { name: 'OPENAI_API_KEY', description: 'OpenAI API key for AI features', minLength: 20, prefix: 'sk-' },
    { name: 'GEMINI_API_KEY', description: 'Google Gemini API key for AI features', minLength: 20 },
    { name: 'KLING_ACCESS_KEY', description: 'Kling AI access key' },
    { name: 'KLING_SECRET_KEY', description: 'Kling AI secret key' },
    { name: 'HUGGINGFACE_API_KEY', description: 'HuggingFace API key' }
  ]
};

let hasErrors = false;
let hasWarnings = false;

// Validate required variables
console.log('\n📋 Required Variables:');
validationRules.required.forEach(rule => {
  const value = process.env[rule.name];
  
  if (!value) {
    console.log(`❌ ${rule.name}: MISSING - ${rule.description}`);
    hasErrors = true;
  } else if (rule.minLength && value.length < rule.minLength) {
    console.log(`❌ ${rule.name}: TOO SHORT (${value.length} chars, need ${rule.minLength}) - ${rule.description}`);
    hasErrors = true;
  } else if (rule.prefix && !value.startsWith(rule.prefix)) {
    console.log(`❌ ${rule.name}: INVALID FORMAT (should start with '${rule.prefix}') - ${rule.description}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${rule.name}: OK - ${rule.description}`);
  }
});

// Validate optional variables
console.log('\n🔧 Optional Variables (AI Features):');
validationRules.optional.forEach(rule => {
  const value = process.env[rule.name];
  
  if (!value || value.includes('your_') || value.includes('here')) {
    console.log(`⚠️  ${rule.name}: NOT SET - ${rule.description} (AI features may be limited)`);
    hasWarnings = true;
  } else if (rule.minLength && value.length < rule.minLength) {
    console.log(`⚠️  ${rule.name}: TOO SHORT (${value.length} chars, need ${rule.minLength}) - ${rule.description}`);
    hasWarnings = true;
  } else if (rule.prefix && !value.startsWith(rule.prefix)) {
    console.log(`⚠️  ${rule.name}: INVALID FORMAT (should start with '${rule.prefix}') - ${rule.description}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${rule.name}: OK - ${rule.description}`);
  }
});

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.log('❌ VALIDATION FAILED: Critical environment variables are missing or invalid');
  console.log('\nFor Railway deployment:');
  console.log('1. Go to Railway dashboard → Your Project → Variables');
  console.log('2. Set the missing required variables');
  console.log('3. Redeploy your application');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  VALIDATION PASSED WITH WARNINGS: Some AI features may be limited');
  console.log('Consider setting the optional API keys for full functionality');
} else {
  console.log('✅ VALIDATION PASSED: All environment variables are properly configured');
}

// Environment-specific advice
if (environment === 'production') {
  console.log('\n🚀 Production Environment Detected:');
  console.log('- Ensure all API keys are set in Railway dashboard');
  console.log('- Monitor your API usage and costs');
  console.log('- Keep your secrets secure and rotate them regularly');
} else if (environment === 'development') {
  console.log('\n🛠️  Development Environment Detected:');
  console.log('- Update your .env file with real API keys for testing');
  console.log('- Never commit real API keys to version control');
}

console.log('\n✨ Environment validation completed!');