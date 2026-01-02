import fetch from 'node-fetch';

async function testSchedulerAPI() {
  console.log('🔍 Testing Scheduler API...\n');

  const testData = {
    title: "Test Content",
    description: "This is a test content description",
    platform: "youtube",
    contentType: "video",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
  };

  console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));

  try {
    // First, let's check if the server is running
    const healthCheck = await fetch('http://localhost:5000/api/health');
    console.log('🏥 Health check status:', healthCheck.status);

    // Test the content creation endpoint
    const response = await fetch('http://localhost:5000/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You might need a real token
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed!');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server might not be running. Start it with: npm run dev');
    }
  }
}

// Test database connection
async function testDatabase() {
  console.log('\n🗄️ Testing Database Connection...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('📊 Database status:', data);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDatabase();
  await testSchedulerAPI();
}

runTests().catch(console.error); 