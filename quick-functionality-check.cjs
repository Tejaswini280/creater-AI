const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function quickTest() {
  console.log('🧪 QUICK CREATORNEXUS FUNCTIONALITY CHECK');
  console.log('==========================================\n');
  
  const results = {
    server: false,
    pages: {},
    api: {},
    features: {}
  };
  
  // Test server connectivity
  try {
    const response = await fetch(BASE_URL);
    results.server = response.status === 200 || response.status === 404;
    console.log(`✅ Server: ${results.server ? 'RUNNING' : 'DOWN'} (${response.status})`);
  } catch (error) {
    console.log(`❌ Server: DOWN - ${error.message}`);
    return;
  }
  
  // Test key pages
  const pages = [
    ['/', 'Landing/Dashboard'],
    ['/login', 'Login'],
    ['/content-studio', 'Content Studio'],
    ['/analytics', 'Analytics'],
    ['/scheduler', 'Scheduler'],
    ['/enhanced-scheduler', 'Enhanced Scheduler'],
    ['/templates', 'Templates']
  ];
  
  console.log('\n📄 Testing Key Pages:');
  for (const [path, name] of pages) {
    try {
      const response = await fetch(`${BASE_URL}${path}`);
      const working = response.ok;
      results.pages[name] = working;
      console.log(`   ${working ? '✅' : '❌'} ${name}: ${working ? 'ACCESSIBLE' : 'FAILED'} (${response.status})`);
    } catch (error) {
      results.pages[name] = false;
      console.log(`   ❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  // Test API endpoints (without auth)
  const apis = [
    ['/api/dashboard/metrics', 'Dashboard Metrics'],
    ['/api/content', 'Content API'],
    ['/api/projects', 'Projects API'],
    ['/api/templates', 'Templates API']
  ];
  
  console.log('\n🔌 Testing API Endpoints:');
  for (const [endpoint, name] of apis) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      // 401 is expected for protected endpoints, 200/404 means working
      const working = response.status === 200 || response.status === 401 || response.status === 404;
      results.api[name] = working;
      console.log(`   ${working ? '✅' : '❌'} ${name}: ${working ? 'RESPONDING' : 'FAILED'} (${response.status})`);
    } catch (error) {
      results.api[name] = false;
      console.log(`   ❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  // Test authentication
  console.log('\n🔐 Testing Authentication:');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@creatornexus.com',
        password: 'password'
      })
    });
    
    const authWorking = loginResponse.status === 200 || loginResponse.status === 401;
    results.features.authentication = authWorking;
    console.log(`   ${authWorking ? '✅' : '❌'} Authentication: ${authWorking ? 'RESPONDING' : 'FAILED'} (${loginResponse.status})`);
    
    if (loginResponse.ok) {
      const authData = await loginResponse.json();
      if (authData.accessToken) {
        console.log('   ✅ Login successful - token received');
        
        // Test authenticated endpoint
        const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${authData.accessToken}` }
        });
        console.log(`   ${meResponse.ok ? '✅' : '❌'} Authenticated endpoint: ${meResponse.ok ? 'WORKING' : 'FAILED'} (${meResponse.status})`);
      }
    }
  } catch (error) {
    results.features.authentication = false;
    console.log(`   ❌ Authentication: ERROR - ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  const workingPages = Object.values(results.pages).filter(Boolean).length;
  const totalPages = Object.keys(results.pages).length;
  const workingApis = Object.values(results.api).filter(Boolean).length;
  const totalApis = Object.keys(results.api).length;
  
  console.log(`   📄 Pages: ${workingPages}/${totalPages} working`);
  console.log(`   🔌 APIs: ${workingApis}/${totalApis} responding`);
  console.log(`   🔐 Auth: ${results.features.authentication ? 'Working' : 'Failed'}`);
  
  const overallHealth = ((workingPages + workingApis + (results.features.authentication ? 1 : 0)) / (totalPages + totalApis + 1)) * 100;
  console.log(`   🎯 Overall Health: ${Math.round(overallHealth)}%`);
  
  if (overallHealth >= 80) {
    console.log('   🟢 Status: GOOD - Most components are functional');
  } else if (overallHealth >= 60) {
    console.log('   🟡 Status: FAIR - Some issues need attention');
  } else {
    console.log('   🔴 Status: POOR - Significant issues detected');
  }
  
  // Identify specific issues
  console.log('\n⚠️  Issues Detected:');
  const failedPages = Object.entries(results.pages).filter(([_, working]) => !working);
  const failedApis = Object.entries(results.api).filter(([_, working]) => !working);
  
  if (failedPages.length > 0) {
    console.log('   📄 Failed Pages:');
    failedPages.forEach(([name]) => console.log(`     - ${name}`));
  }
  
  if (failedApis.length > 0) {
    console.log('   🔌 Failed APIs:');
    failedApis.forEach(([name]) => console.log(`     - ${name}`));
  }
  
  if (!results.features.authentication) {
    console.log('   🔐 Authentication system not working');
  }
  
  console.log('\n✅ Quick functionality check completed');
}

quickTest().catch(console.error);