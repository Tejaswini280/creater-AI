#!/usr/bin/env node

/**
 * MANUAL RAILWAY DEPLOYMENT SCRIPT
 * Use this for immediate deployment while GitHub Actions is being fixed
 */

const { execSync } = require('child_process');

console.log('🚀 Manual Railway Deployment');
console.log('============================');

// Your Railway credentials
const RAILWAY_TOKEN = '7bea4487-4542-4542-a02e-a40888c4b2b8';
const RAILWAY_PROJECT_ID = '711091cc-10bf-41a3-87cf-8d058419de4f';
const RAILWAY_STAGING_SERVICE_ID = '01abc727-2496-4948-95e7-c05f629936e8';
const RAILWAY_PROD_SERVICE_ID = 'db7499d8-fa40-476e-a943-9d62370bf3a8';

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
  
  // Install Railway CLI
  if (!runCommand('npm install -g @railway/cli@latest', 'Installing Railway CLI')) {
    return false;
  }
  
  // Link to staging service
  if (!runCommand(`railway link ${RAILWAY_PROJECT_ID} ${RAILWAY_STAGING_SERVICE_ID}`, 'Linking to staging service')) {
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
  
  // Install Railway CLI
  if (!runCommand('npm install -g @railway/cli@latest', 'Installing Railway CLI')) {
    return false;
  }
  
  // Link to production service
  if (!runCommand(`railway link ${RAILWAY_PROJECT_ID} ${RAILWAY_PROD_SERVICE_ID}`, 'Linking to production service')) {
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
  console.log('Usage: node manual-deploy.cjs [staging|production]');
  console.log('Default: staging');
}
