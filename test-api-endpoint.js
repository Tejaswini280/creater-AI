// Test the bulk content generation API endpoint
const testBulkContentEndpoint = async () => {
  console.log('🧪 Testing Bulk Content Generation API Endpoint...');

  const testData = {
    projectId: 'test-project-123',
    contentTitle: 'Digital Marketing Tips',
    contentType: 'post',
    platform: 'instagram',
    schedulingDuration: '1week',
    targetAudience: 'small business owners',
    tone: 'professional'
  };

  try {
    console.log('📤 Sending request to /api/content/bulk-generate-schedule');

    const response = await fetch('http://localhost:5000/api/content/bulk-generate-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need proper authentication
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📥 Response status: ${response.status}`);

    if (response.status === 404) {
      console.error('❌ 404 Not Found - Endpoint not found');
      console.error('🔧 This suggests the server needs to be restarted to pick up new routes');
      return;
    }

    if (response.status === 401) {
      console.log('⚠️ 401 Unauthorized - Authentication required');
      console.log('✅ This means the endpoint exists but needs authentication');
      return;
    }

    const data = await response.json();
    console.log('✅ Success! API Response:', data);

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.message.includes('fetch')) {
      console.error('🔧 Server might not be running or accessible');
    }
  }
};

// Test basic endpoint
const testBasicEndpoint = async () => {
  console.log('🧪 Testing basic API endpoint...');

  try {
    const response = await fetch('http://localhost:5000/api/test/simple');
    const data = await response.json();
    console.log('✅ Basic endpoint works:', data);
  } catch (error) {
    console.error('❌ Basic endpoint failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  await testBasicEndpoint();
  console.log('---');
  await testBulkContentEndpoint();
};

runTests();
