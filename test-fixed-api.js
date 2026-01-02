// Test the fixed bulk content generation API endpoint
const testFixedAPI = async () => {
  console.log('🧪 Testing Fixed Bulk Content API...');

  try {
    // Test basic endpoint first
    console.log('📡 Testing basic endpoint...');
    const basicResponse = await fetch('http://localhost:5000/api/test/simple');
    const basicData = await basicResponse.json();
    console.log('✅ Basic endpoint works:', basicData);

    // Test bulk endpoint (will get 401 due to auth, but should not be 404)
    console.log('📡 Testing bulk content endpoint...');
    const bulkResponse = await fetch('http://localhost:5000/api/content/bulk-generate-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: 'test-123',
        contentTitle: 'Test Content',
        contentType: 'post',
        platform: 'instagram',
        schedulingDuration: '1week'
      })
    });

    console.log(`📊 Bulk endpoint status: ${bulkResponse.status}`);

    if (bulkResponse.status === 404) {
      console.error('❌ Still getting 404 - endpoint not found');
    } else if (bulkResponse.status === 401) {
      console.log('✅ Got 401 (Unauthorized) - endpoint exists but needs authentication!');
      console.log('🎉 This means our server is working and the route is registered!');
    } else {
      const data = await bulkResponse.json();
      console.log('✅ Success! Response:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testFixedAPI();
