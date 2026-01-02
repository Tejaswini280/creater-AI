const http = require('http');

console.log('🔍 Verifying Login → Dashboard Fix');
console.log('=====================================');

// Test if server is running
function testServer() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running on localhost:5000');
          resolve(true);
        } else {
          console.log(`⚠️ Server responded with status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Server is not running on localhost:5000');
      console.log('   Please run: npm run dev');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Server request timed out');
      resolve(false);
    });
  });
}

// Test login endpoint
function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Login endpoint working');
          try {
            const result = JSON.parse(data);
            console.log(`   User: ${result.user?.email || 'Unknown'}`);
          } catch (e) {
            console.log('   Response received but not JSON');
          }
          resolve(true);
        } else {
          console.log(`❌ Login failed with status ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Login request failed: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Login request timed out');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('\n1. Testing server status...');
  const serverRunning = await testServer();
  
  if (!serverRunning) {
    console.log('\n❌ Cannot continue tests - server not running');
    console.log('\nTo fix:');
    console.log('1. Run: npm run dev');
    console.log('2. Wait for server to start');
    console.log('3. Run this test again');
    return;
  }

  console.log('\n2. Testing login endpoint...');
  const loginWorking = await testLogin();

  console.log('\n=====================================');
  console.log('📋 SUMMARY:');
  console.log(`Server Running: ${serverRunning ? '✅' : '❌'}`);
  console.log(`Login Working: ${loginWorking ? '✅' : '❌'}`);

  if (serverRunning && loginWorking) {
    console.log('\n🎉 SUCCESS! Login flow should work properly now.');
    console.log('\nNext steps:');
    console.log('1. Open: http://localhost:5000');
    console.log('2. Login with: test@example.com / password123');
    console.log('3. Verify dashboard loads without "Something went wrong" error');
    console.log('4. Open test page: test-login-dashboard-flow-final.html');
  } else {
    console.log('\n⚠️ Some issues detected. Check the logs above.');
  }
}

runTests().catch(console.error);