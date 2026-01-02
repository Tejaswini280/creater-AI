#!/usr/bin/env node

/**
 * Quick fix for missing API keys in production environment
 * This script helps identify and fix the OpenAI API key issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 API Keys Production Fix');
console.log('==========================');

// Check current environment variables
console.log('\n📋 Current Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NOT SET');

// Check .env files
const envFiles = ['.env', '.env.production', '.env.staging'];
console.log('\n📁 Environment Files Check:');

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    const content = fs.readFileSync(file, 'utf8');
    const hasOpenAI = content.includes('OPENAI_API_KEY=') && !content.includes('OPENAI_API_KEY=your_openai_api_key_here');
    const hasGemini = content.includes('GEMINI_API_KEY=') && !content.includes('GEMINI_API_KEY=your_gemini_api_key_here');
    console.log(`   - OpenAI API Key: ${hasOpenAI ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   - Gemini API Key: ${hasGemini ? '✅ SET' : '❌ NOT SET'}`);
  } else {
    console.log(`❌ ${file} does not exist`);
  }
});

console.log('\n🚀 Solutions:');
console.log('1. For Railway deployment:');
console.log('   - Go to your Railway project dashboard');
console.log('   - Navigate to Variables tab');
console.log('   - Add OPENAI_API_KEY with your actual API key');
console.log('   - Add GEMINI_API_KEY with your actual API key');

console.log('\n2. For local development:');
console.log('   - Update your .env file with real API keys');
console.log('   - Replace placeholder values with actual keys');

console.log('\n3. For Docker deployment:');
console.log('   - Set environment variables in docker-compose.yml');
console.log('   - Or pass them via -e flags when running docker run');

console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('- Never commit real API keys to version control');
console.log('- Use environment variables for all sensitive data');
console.log('- Keep your API keys secure and rotate them regularly');

// Create a temporary fix for development
if (process.env.NODE_ENV === 'development') {
  console.log('\n🔧 Creating temporary development fix...');
  
  const tempEnvContent = `# Temporary fix for development
# Replace these with your actual API keys
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
`;

  if (!fs.existsSync('.env.temp')) {
    fs.writeFileSync('.env.temp', tempEnvContent);
    console.log('✅ Created .env.temp file - update it with your real API keys');
  }
}

console.log('\n✨ Fix completed! Update your environment variables and restart the application.');