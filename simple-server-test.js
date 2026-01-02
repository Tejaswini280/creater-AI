import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testServerConnection() {
  console.log('🧪 Testing Server Connection...\n');

  try {
    // Test basic server response
    const response = await axios.get(`${BASE_URL}/api/auth/user`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Server is responding');
    console.log('Response status:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('✅ Server is responding (expected auth error)');
      console.log('Response status:', error.response.status);
      console.log('Response message:', error.response.data.message);
    } else {
      console.log('❌ Server connection failed');
      console.log('Error:', error.message);
    }
  }

  // Test a public endpoint if available
  try {
    const response = await axios.get(`${BASE_URL}/api/templates`);
    console.log('✅ Templates endpoint working');
    console.log('Response status:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('✅ Templates endpoint responding (may need auth)');
      console.log('Response status:', error.response.status);
    } else {
      console.log('❌ Templates endpoint failed');
      console.log('Error:', error.message);
    }
  }
}

testServerConnection().catch(console.error); 