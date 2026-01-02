const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProjectCreation() {
  try {
    console.log('🧪 Testing Project Creation API...');
    
    // Test 1: Check if server is running
    console.log('\n1️⃣ Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Server is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 2: Check authentication
    console.log('\n2️⃣ Testing authentication...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'password'
      });
      console.log('✅ Authentication successful');
      const token = authResponse.data.accessToken;
      
      // Test 3: Create project with minimal data
      console.log('\n3️⃣ Testing project creation...');
      const projectData = {
        name: 'Test Project - Debug',
        description: 'This is a test project for debugging',
        type: 'video',
        platform: 'youtube',
        tags: ['test', 'debug']
      };
      
      console.log('📝 Sending project data:', JSON.stringify(projectData, null, 2));
      
      const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Project created successfully!');
      console.log('📊 Response:', projectResponse.data);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Project creation failed with status:', error.response.status);
        console.log('📝 Error response:', error.response.data);
        
        // Check if it's an authentication error
        if (error.response.status === 401) {
          console.log('🔐 Authentication failed - trying to create test user...');
          try {
            const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
              email: 'debug@example.com',
              password: 'debugpassword123',
              firstName: 'Debug',
              lastName: 'User'
            });
            console.log('✅ Test user created:', registerResponse.data);
            
            // Try login again
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
              email: 'debug@example.com',
              password: 'debugpassword123'
            });
            console.log('✅ Login successful with test user');
            
            // Try project creation again
            const projectData = {
              name: 'Test Project - Debug User',
              description: 'This is a test project for debugging',
              type: 'video',
              platform: 'youtube',
              tags: ['test', 'debug']
            };
            
            const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginResponse.data.accessToken}`
              }
            });
            
            console.log('✅ Project created successfully with test user!');
            console.log('📊 Response:', projectResponse.data);
            
          } catch (registerError) {
            console.log('❌ Failed to create test user:', registerError.response?.data || registerError.message);
          }
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testProjectCreation();
