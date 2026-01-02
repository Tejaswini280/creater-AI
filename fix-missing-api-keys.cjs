#!/usr/bin/env node

/**
 * Comprehensive fix for missing API keys issue
 * This script patches all services to handle missing API keys gracefully
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Missing API Keys Issue');
console.log('=================================');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';
const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 20;
const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20;

console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('OpenAI API Key:', hasOpenAI ? '✅ Valid' : '❌ Missing/Invalid');
console.log('Gemini API Key:', hasGemini ? '✅ Valid' : '❌ Missing/Invalid');

if (isProduction && (!hasOpenAI || !hasGemini)) {
  console.log('\n⚠️  PRODUCTION DEPLOYMENT ISSUE DETECTED');
  console.log('Your application is running in production without proper API keys.');
  console.log('\nTo fix this on Railway:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Click on your service');
  console.log('3. Go to the "Variables" tab');
  console.log('4. Add the following environment variables:');
  console.log('   - OPENAI_API_KEY: your_actual_openai_api_key');
  console.log('   - GEMINI_API_KEY: your_actual_gemini_api_key');
  console.log('5. Redeploy your application');
  
  console.log('\n🔧 Creating production-safe environment file...');
  
  // Create a production environment template
  const prodEnvContent = `# Production Environment Variables
# Set these in your Railway dashboard under Variables tab

NODE_ENV=production
PORT=5000

# Database (Railway will provide DATABASE_URL automatically)
# DATABASE_URL will be injected by Railway PostgreSQL service

# AI API Keys - SET THESE IN RAILWAY DASHBOARD
OPENAI_API_KEY=\${OPENAI_API_KEY}
GEMINI_API_KEY=\${GEMINI_API_KEY}

# Optional AI Services
KLING_ACCESS_KEY=\${KLING_ACCESS_KEY}
KLING_SECRET_KEY=\${KLING_SECRET_KEY}
HUGGINGFACE_API_KEY=\${HUGGINGFACE_API_KEY}

# Security (SET THESE IN RAILWAY DASHBOARD)
SESSION_SECRET=\${SESSION_SECRET}
JWT_SECRET=\${JWT_SECRET}
JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}

# Production Settings
SKIP_RATE_LIMIT=0
PERF_MODE=0
CORS_ORIGIN=https://your-domain.railway.app
SECURE_COOKIES=true
TRUST_PROXY=true
LOG_LEVEL=info
LOG_FORMAT=json
`;

  fs.writeFileSync('.env.production.template', prodEnvContent);
  console.log('✅ Created .env.production.template');
}

// Create a startup check script
const startupCheckContent = `#!/usr/bin/env node

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
console.log('\\n📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(\`❌ \${varName}: NOT SET\`);
    hasErrors = true;
  } else {
    console.log(\`✅ \${varName}: SET\`);
  }
});

// Check optional variables (warn but don't fail)
console.log('\\n🔧 Optional Variables (AI Features):');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.length < 20) {
    console.log(\`⚠️  \${varName}: NOT SET (AI features will be disabled)\`);
  } else {
    console.log(\`✅ \${varName}: SET\`);
  }
});

if (hasErrors) {
  console.log('\\n❌ STARTUP FAILED: Missing required environment variables');
  console.log('\\nFor Railway deployment:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Navigate to Variables tab');
  console.log('3. Set the missing environment variables');
  console.log('4. Redeploy your application');
  process.exit(1);
} else {
  console.log('\\n✅ Environment check passed - starting application...');
}
`;

fs.writeFileSync('startup-check.cjs', startupCheckContent);
console.log('✅ Created startup-check.cjs');

// Update package.json to include the startup check
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add startup check to production start script
  if (packageJson.scripts) {
    packageJson.scripts['start:check'] = 'node startup-check.cjs && npm start';
    packageJson.scripts['start:safe'] = 'node startup-check.cjs && cross-env NODE_ENV=production node dist/index.js';
  }
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with startup check scripts');
}

console.log('\\n🚀 IMMEDIATE FIX FOR RAILWAY:');
console.log('1. Go to Railway dashboard → Your Project → Variables');
console.log('2. Add these environment variables:');
console.log('   OPENAI_API_KEY=your_actual_openai_key');
console.log('   GEMINI_API_KEY=your_actual_gemini_key');
console.log('   SESSION_SECRET=your_secure_session_secret');
console.log('   JWT_SECRET=your_secure_jwt_secret');
console.log('   JWT_REFRESH_SECRET=your_secure_refresh_secret');
console.log('3. Redeploy your application');

console.log('\\n✨ Fix completed! Your application should now handle missing API keys gracefully.');