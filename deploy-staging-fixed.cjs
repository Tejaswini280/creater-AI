#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🎯 STAGING DEPLOYMENT');
console.log('====================');

const RAILWAY_TOKEN = '7bea4487-4542-4542-a02e-a40888c4b2b8';
const RAILWAY_PROJECT_ID = '711091cc-10bf-41a3-87cf-8d058419de4f';
const RAILWAY_STAGING_SERVICE_ID = '01abc727-2496-4948-95e7-c05f629936e8';

try {
  console.log('📦 Installing Railway CLI...');
  execSync('npm install -g @railway/cli@latest', { stdio: 'inherit' });
  
  console.log('🔗 Linking to staging service...');
  execSync(`railway link ${RAILWAY_PROJECT_ID} ${RAILWAY_STAGING_SERVICE_ID}`, { 
    stdio: 'inherit',
    env: { ...process.env, RAILWAY_TOKEN }
  });
  
  console.log('🚀 Deploying to staging...');
  execSync('railway up --detach', { 
    stdio: 'inherit',
    env: { ...process.env, RAILWAY_TOKEN }
  });
  
  console.log('\n✅ Staging deployment successful!');
  console.log('🌐 Check Railway dashboard for deployment status');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
