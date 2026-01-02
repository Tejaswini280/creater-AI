#!/usr/bin/env node

/**
 * Generate secure secrets for production deployment
 */

import crypto from 'crypto';

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecrets() {
  console.log('🔐 Generating secure secrets for production deployment\n');
  
  const secrets = {
    SESSION_SECRET: generateSecret(32),
    JWT_SECRET: generateSecret(32),
    JWT_REFRESH_SECRET: generateSecret(32)
  };

  console.log('Copy these to your Railway environment variables:\n');
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\n📋 Railway Environment Variables Setup:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Click on your service');
  console.log('3. Go to "Variables" tab');
  console.log('4. Add each variable above');
  console.log('\n🔑 Also add your API keys:');
  console.log('OPENAI_API_KEY=your-openai-key');
  console.log('GEMINI_API_KEY=your-gemini-key');
  console.log('KLING_ACCESS_KEY=your-kling-access-key');
  console.log('KLING_SECRET_KEY=your-kling-secret-key');
  console.log('HUGGINGFACE_API_KEY=your-huggingface-key');
  
  console.log('\n✅ Security secrets generated successfully!');
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  generateSecrets();
}

export { generateSecret, generateSecrets };