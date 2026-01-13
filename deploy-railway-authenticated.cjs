#!/usr/bin/env node

/**
 * AUTHENTICATED RAILWAY DEPLOYMENT
 * 
 * This script properly authenticates with Railway using your token
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log('🚀 AUTHENTICATED RAILWAY DEPLOYMENT');
console.log('==================================');

// Your Railway credentials
const RAILWAY_TOKEN = '7bea4487-4542-4542-a02e-a40888c4b2b8';
const RAILWAY_PROJECT_ID = '711091cc-10bf-41a3-87cf-8d058419de4f';
const RAILWAY_STAGING_SERVICE_ID = '01abc727-2496-4948-95e7-c05f629936e8';
const RAILWAY_PROD_SERVICE_ID = 'db7499d8-fa40-476e-a943-9d62370bf3a8';

function setupRailwayAuth() {
  console.log('🔐 Setting up Railway authentication...');
  
  // Create Railway config directory
  const railwayDir = path.join(os.homedir(), '.railway');
  if (!fs.existsSync(railwayDir)) {
    fs.mkdirSync(railwayDir, { recursive: true });
  }
  
  // Create config file with token
  const configPath = path.join(railwayDir, 'config.json');
  const config = {
    token: RAILWAY_TOKEN
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Railway authentication configured');
}

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  console.log(`🔧 Running: ${command}`);
  try {
    const output = execSync(command, { 
      stdio: 'inherit', 
      env: { 
        ...process.env, 
        RAILWAY_TOKEN 
      } 
    });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function deployToStaging() {
  console.log('\n🎯 Deploying to STAGING');
  console.log('========================');
  
  // Setup authentication
  setupRailwayAuth();
  
  // Install Railway CLI
  if (!runCommand('npm install -g @railway/cli@latest', 'Installing Railway CLI')) {
    return false;
  }
  
  // Verify authentication
  if (!runCommand('railway whoami', 'Verifying authentication')) {
    console.log('⚠️  Authentication verification failed, but continuing...');
  }
  
  // Link to staging service
  if (!runCommand(`railway link --project ${RAILWAY_PROJECT_ID} --service ${RAILWAY_STAGING_SERVICE_ID}`, 'Linking to staging service')) {
    return false;
  }
  
  // Deploy
  if (!runCommand('railway up --detach', 'Deploying to staging')) {
    return false;
  }
  
  console.log('\n✅ Staging deployment initiated successfully!');
  console.log('🌐 Check Railway dashboard for deployment status');
  return true;
}

async function deployToProduction() {
  console.log('\n🎯 Deploying to PRODUCTION');
  console.log('===========================');
  
  // Setup authentication
  setupRailwayAuth();
  
  // Install Railway CLI
  if (!runCommand('npm install -g @railway/cli@latest', 'Installing Railway CLI')) {
    return false;
  }
  
  // Verify authentication
  if (!runCommand('railway whoami', 'Verifying authentication')) {
    console.log('⚠️  Authentication verification failed, but continuing...');
  }
  
  // Link to production service
  if (!runCommand(`railway link --project ${RAILWAY_PROJECT_ID} --service ${RAILWAY_PROD_SERVICE_ID}`, 'Linking to production service')) {
    return false;
  }
  
  // Deploy
  if (!runCommand('railway up --detach', 'Deploying to production')) {
    return false;
  }
  
  console.log('\n✅ Production deployment initiated successfully!');
  console.log('🌐 Check Railway dashboard for deployment status');
  return true;
}

// Main execution
const args = process.argv.slice(2);
const environment = args[0] || 'staging';

if (environment === 'staging') {
  deployToStaging();
} else if (environment === 'production') {
  deployToProduction();
} else {
  console.log('Usage: node deploy-railway-authenticated.cjs [staging|production]');
  console.log('Default: staging');
}