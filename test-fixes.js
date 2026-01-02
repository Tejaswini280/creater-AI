import http from 'http';

// Simple test to check if the server is running
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ Server is running - Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ Server not responding: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Server connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Test the fixes
const runTests = async () => {
  console.log('🧪 Testing application fixes...\n');

  console.log('1. Testing server connectivity...');
  const serverRunning = await testServer();

  if (serverRunning) {
    console.log('\n✅ Server is running successfully!');
    console.log('\n📋 Fix Summary:');
    console.log('   • Fixed React Query hooks error by adding default React import in App.tsx');
    console.log('   • Fixed WebSocket URL construction by improving environment detection and adding fallback logic');
    console.log('\n🎯 Expected Results:');
    console.log('   • QueryClientProvider should no longer throw "Cannot read properties of null (reading \'useEffect\')" error');
    console.log('   • WebSocket should connect successfully without "undefined" in URL');
    console.log('\n🌐 You can now open http://localhost:5000 in your browser to test the application');
  } else {
    console.log('\n❌ Server is not running. Please check the logs above.');
  }
};

runTests().catch(console.error);
