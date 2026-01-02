// Test bulk content API endpoint with authentication
const testBulkAPI = async () => {
  console.log('🧪 Testing Bulk Content API with Authentication...\n');

  try {
    // First, try to get a test token by checking if there's a login endpoint
    console.log('📡 Testing authentication...');

    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    console.log('Login response status:', loginResponse.status);

    let authToken = null;

    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      authToken = loginData.token || loginData.accessToken;
      console.log('✅ Got authentication token');
    } else {
      console.log('⚠️ Login failed, trying without authentication');
    }

    // Test the bulk content endpoint
    console.log('\n📡 Testing bulk content endpoint...');

    const headers = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const bulkResponse = await fetch('http://localhost:5000/api/content/bulk-generate-schedule', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        projectId: 'test-project-123',
        contentTitle: 'Digital Marketing Tips',
        contentType: 'post',
        platform: 'instagram',
        schedulingDuration: '1week',
        startDate: new Date().toISOString(),
        targetAudience: 'small business owners',
        tone: 'professional'
      })
    });

    console.log('Bulk API response status:', bulkResponse.status);

    if (bulkResponse.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (401 Unauthorized)');
      console.log('🔧 This is expected if no valid token is provided');
    } else if (bulkResponse.status === 404) {
      console.log('❌ Endpoint not found (404)');
      console.log('🔧 This means the route is not properly registered');
    } else if (bulkResponse.status === 200) {
      const data = await bulkResponse.json();
      console.log('✅ Success! Response:', data);
    } else {
      const errorText = await bulkResponse.text();
      console.log('❓ Unexpected status:', bulkResponse.status);
      console.log('Response:', errorText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testBulkAPI();
