const http = require('http');

console.log('🔍 Testing Server Endpoints');
console.log('===========================\n');

// Test server health
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  const tests = [
    {
      name: 'Server Health Check',
      path: '/',
      method: 'GET'
    },
    {
      name: 'Auto-Schedule Optimal Times (Instagram)',
      path: '/api/auto-schedule/optimal-times/instagram',
      method: 'GET'
    },
    {
      name: 'Auto-Schedule Optimal Times (LinkedIn)',
      path: '/api/auto-schedule/optimal-times/linkedin',
      method: 'GET'
    },
    {
      name: 'Auto-Schedule Project',
      path: '/api/auto-schedule/project',
      method: 'POST',
      data: {
        projectId: 1,
        contentType: 'social-media',
        platforms: ['instagram', 'linkedin'],
        contentFrequency: 'daily',
        duration: '1week',
        startDate: new Date().toISOString(),
        targetAudience: 'Test audience',
        category: 'marketing',
        tags: ['test']
      }
    },
    {
      name: 'Get Auto-Scheduled Content',
      path: '/api/auto-schedule/project/1',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      const result = await testEndpoint(test.path, test.method, test.data);
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`   ✅ Status: ${result.status}`);
        
        try {
          const jsonBody = JSON.parse(result.body);
          console.log(`   📝 Response: ${JSON.stringify(jsonBody, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   📝 Response: ${result.body.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
        console.log(`   📝 Response: ${result.body.substring(0, 200)}...`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
}

runTests().then(() => {
  console.log('✅ Endpoint testing complete!');
}).catch((error) => {
  console.error('❌ Test suite failed:', error);
});