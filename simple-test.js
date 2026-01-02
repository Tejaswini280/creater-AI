// Simple test to check server connectivity
const { spawn } = require('child_process');

console.log('🔍 Checking server status...');

// Try to start a simple curl-like request using Node.js
const http = require('http');

const testRequest = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`📡 ${path} - Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 100) + '...' });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

async function runTests() {
  try {
    console.log('Testing basic connectivity...');
    const basicTest = await testRequest('/');
    console.log('✅ Server is responding to basic requests');

    console.log('\nTesting simple API endpoint...');
    const apiTest = await testRequest('/api/test/simple');
    console.log('✅ API endpoint working:', apiTest);

    console.log('\nTesting bulk content endpoint (expecting 401 due to auth)...');
    const bulkTest = await testRequest('/api/content/bulk-generate-schedule');
    console.log('📊 Bulk endpoint response:', bulkTest);

  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('🔧 Server might not be running. Try: npm run dev');
  }
}

runTests();
