#!/usr/bin/env node

/**
 * Verify Railway Deployment Status
 * This script checks the current state of your Railway deployment
 */

const { execSync } = require('child_process');

console.log('🔍 Verifying Railway deployment status...');

async function checkRailwayStatus() {
  try {
    console.log('📡 Getting Railway service information...');
    
    // Get Railway status
    const statusOutput = execSync('railway status --json', { encoding: 'utf8' });
    const status = JSON.parse(statusOutput);
    
    console.log('📋 Railway Service Status:');
    console.log('- Service ID:', status.serviceId || 'Unknown');
    console.log('- Environment:', status.environment || 'Unknown');
    console.log('- URL:', status.url || 'Not available');
    console.log('- Status:', status.status || 'Unknown');
    
    if (status.url) {
      console.log('\n🧪 Testing deployment endpoints...');
      
      // Test health endpoint
      try {
        const response = await fetch(`${status.url}/api/health`);
        const healthData = await response.json();
        console.log('✅ Health check:', healthData.status);
        console.log('- Uptime:', healthData.uptime, 'seconds');
        console.log('- Static path exists:', healthData.staticExists);
      } catch (error) {
        console.log('❌ Health check failed:', error.message);
      }
      
      // Test frontend
      try {
        const response = await fetch(status.url);
        const html = await response.text();
        if (html.includes('<!DOCTYPE html>')) {
          console.log('✅ Frontend is serving HTML');
        } else {
          console.log('❌ Frontend not serving HTML properly');
          console.log('Response preview:', html.substring(0, 200));
        }
      } catch (error) {
        console.log('❌ Frontend test failed:', error.message);
      }
      
      // Test API endpoint
      try {
        const response = await fetch(`${status.url}/api/status`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API is responding');
        } else {
          console.log('⚠️ API returned status:', response.status);
        }
      } catch (error) {
        console.log('❌ API test failed:', error.message);
      }
    }
    
    return status;
    
  } catch (error) {
    console.log('❌ Error getting Railway status:', error.message);
    console.log('💡 Make sure you are logged in: railway login');
    console.log('💡 Make sure you are linked to the project: railway link');
    return null;
  }
}

async function checkLogs() {
  try {
    console.log('\n📋 Recent Railway logs:');
    const logs = execSync('railway logs --lines 20', { encoding: 'utf8' });
    console.log(logs);
  } catch (error) {
    console.log('❌ Could not fetch logs:', error.message);
  }
}

async function checkVariables() {
  try {
    console.log('\n🔧 Checking environment variables...');
    
    const variables = [
      'DATABASE_URL',
      'NODE_ENV',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY'
    ];
    
    for (const variable of variables) {
      try {
        const value = execSync(`railway variables get ${variable}`, { encoding: 'utf8' }).trim();
        if (value && value !== 'null') {
          console.log(`✅ ${variable}: Set (${value.length} chars)`);
        } else {
          console.log(`❌ ${variable}: Not set or empty`);
        }
      } catch (error) {
        console.log(`❌ ${variable}: Error getting value`);
      }
    }
  } catch (error) {
    console.log('❌ Error checking variables:', error.message);
  }
}

async function main() {
  const status = await checkRailwayStatus();
  await checkVariables();
  await checkLogs();
  
  console.log('\n🎯 Summary:');
  if (status && status.url) {
    console.log('✅ Railway deployment is active');
    console.log('🔗 URL:', status.url);
    console.log('💡 If the frontend is not loading, the issue is likely:');
    console.log('   1. Database schema problems (run fix-railway-database-remote.ps1)');
    console.log('   2. Missing environment variables');
    console.log('   3. Build issues (check logs above)');
  } else {
    console.log('❌ Railway deployment status unclear');
    console.log('💡 Try: railway login && railway link');
  }
}

main().catch(console.error);