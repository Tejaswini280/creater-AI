// Test server status and API endpoints
const http = require('http');

function testEndpoint(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            path: path
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data.substring(0, 200) + '...',
            path: path,
            raw: true
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing Server and API Endpoints...\n');

  try {
    // Test basic server connectivity
    console.log('📡 Testing basic server connectivity...');
    const basicTest = await testEndpoint('/');
    if (basicTest.status === 200 && basicTest.raw) {
      console.log('✅ Server is running (serving HTML)');
    } else {
      console.log('❌ Server not responding properly');
      return;
    }

    // Test simple API endpoint
    console.log('\n📡 Testing simple API endpoint...');
    const apiTest = await testEndpoint('/api/test/simple');
    if (apiTest.status === 200) {
      console.log('✅ API routes are working:', apiTest.data.message);
    } else {
      console.log('❌ API routes not working:', apiTest);
      return;
    }

    // Test bulk content endpoint (should get 401 due to auth)
    console.log('\n📡 Testing bulk content endpoint (expecting 401)...');
    const bulkTest = await testEndpoint('/api/content/bulk-generate-schedule', 'POST', {
      projectId: 'test',
      contentTitle: 'test',
      contentType: 'post',
      platform: 'instagram',
      schedulingDuration: '1week'
    });

    if (bulkTest.status === 401) {
      console.log('✅ Bulk content endpoint exists (401 Unauthorized as expected)');
    } else if (bulkTest.status === 404) {
      console.log('❌ Bulk content endpoint not found (404)');
      console.log('🔧 This means the server routes are not loading properly');
    } else {
      console.log('❓ Unexpected response:', bulkTest);
    }

  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('🔧 Server might not be running or accessible');
  }
}

runTests();
