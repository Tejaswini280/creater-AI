#!/usr/bin/env node

/**
 * Rate Limit Manager for CreatorNexus
 * This script helps manage rate limiting settings for different environments
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env');

function updateEnvFile(key, value) {
  let envContent = '';
  
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }
  
  // Remove existing key if it exists
  const lines = envContent.split('\n').filter(line => !line.startsWith(`${key}=`));
  
  // Add new key-value pair
  lines.push(`${key}=${value}`);
  
  // Write back to file
  fs.writeFileSync(envFile, lines.join('\n'));
  console.log(`✅ Updated ${key}=${value} in .env file`);
}

function showCurrentSettings() {
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    const rateLimitSetting = content.split('\n').find(line => line.startsWith('SKIP_RATE_LIMIT='));
    console.log(`📋 Current rate limit setting: ${rateLimitSetting || 'SKIP_RATE_LIMIT not set'}`);
  } else {
    console.log('📋 No .env file found');
  }
}

function showHelp() {
  console.log(`
🚀 CreatorNexus Rate Limit Manager

Usage: node scripts/rate-limit-manager.js [command]

Commands:
  dev          - Set development mode (very permissive rate limiting)
  production   - Set production mode (strict rate limiting)
  disable      - Disable rate limiting completely (SKIP_RATE_LIMIT=1)
  enable       - Enable rate limiting (SKIP_RATE_LIMIT=0)
  status       - Show current settings
  help         - Show this help message

Examples:
  node scripts/rate-limit-manager.js dev
  node scripts/rate-limit-manager.js production
  node scripts/rate-limit-manager.js disable
`);
}

const command = process.argv[2];

switch (command) {
  case 'dev':
    updateEnvFile('NODE_ENV', 'development');
    updateEnvFile('SKIP_RATE_LIMIT', '0');
    console.log('🎯 Set to development mode with permissive rate limiting');
    break;
    
  case 'production':
    updateEnvFile('NODE_ENV', 'production');
    updateEnvFile('SKIP_RATE_LIMIT', '0');
    console.log('🔒 Set to production mode with strict rate limiting');
    break;
    
  case 'disable':
    updateEnvFile('SKIP_RATE_LIMIT', '1');
    console.log('⚠️  Rate limiting disabled - restart server to apply');
    break;
    
  case 'enable':
    updateEnvFile('SKIP_RATE_LIMIT', '0');
    console.log('✅ Rate limiting enabled - restart server to apply');
    break;
    
  case 'status':
    showCurrentSettings();
    break;
    
  case 'help':
  default:
    showHelp();
    break;
}

console.log('\n💡 Remember to restart your server after changing these settings!');
