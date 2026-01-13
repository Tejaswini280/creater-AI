#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🎯 PRODUCTION DEPLOYMENT');
console.log('========================');

const RAILWAY_TOKEN = '7bea4487-4542-4542-a02e-a40888c4b2b8';
const RAILWAY_PROJECT_ID = '711091cc-10bf-41a3-87cf-8d058419de4f';
const RAILWAY_PROD_SERVICE_ID = 'db7499d8-fa40-476e-a943-9d62370bf3a8';

try {
  console.log('📦 Installing Railway CLI...');
  execSync('npm install -g @railway/cli@latest', { stdio: 'inherit' });
  
  console.log('🔗 Linking to production service...');
  execSync(`railway link ${RAILWAY_PROJECT_ID} ${RAILWAY_PROD_SERVICE_ID}`, { 
    stdio: 'inherit',
    env: { ...process.env, RAILWAY_TOKEN }
  });
  
  console.log('🚀 Deploying to production...');
  execSync('railway up --detach', { 
    stdio: 'inherit',
    env: { ...process.env, RAILWAY_TOKEN }
  });
  
  console.log('\n✅ Production deployment successful!');
  console.log('🌐 Check Railway dashboard for deployment status');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
