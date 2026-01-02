import axios from 'axios';

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

    // Test 2: Try to login with existing test user
    console.log('\n2️⃣ Testing authentication with existing test user...');
    let token = null;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'debug@example.com',
        password: 'debugpassword123'
      });
      console.log('✅ Login successful with existing test user');
      token = loginResponse.data.accessToken;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Login failed, trying to create new test user...');
        try {
          const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: 'test2@example.com',
            password: 'testpassword123',
            firstName: 'Test2',
            lastName: 'User'
          });
          console.log('✅ New test user created:', registerResponse.data);
          
          // Try login with new user
          const newLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'test2@example.com',
            password: 'testpassword123'
          });
          console.log('✅ Login successful with new test user');
          token = newLoginResponse.data.accessToken;
          
        } catch (registerError) {
          console.log('❌ Failed to create new test user:', registerError.response?.data || registerError.message);
          return;
        }
      } else {
        console.log('❌ Authentication error:', error.response?.data || error.message);
        return;
      }
    }
    
    if (!token) {
      console.log('❌ No authentication token available');
      return;
    }
    
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
    
    try {
      const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Project created successfully!');
      console.log('📊 Response:', projectResponse.data);
      
      // Test 4: Create content for the project
      console.log('\n4️⃣ Testing content creation...');
      const contentData = {
        title: 'Test Content - Debug',
        description: 'This is test content for debugging',
        platform: 'youtube',
        contentType: 'video',
        tags: ['test', 'content', 'video'],
        status: 'draft',
        projectId: projectResponse.data.project.id
      };
      
      console.log('📝 Sending content data:', JSON.stringify(contentData, null, 2));
      
      const contentResponse = await axios.post(`${BASE_URL}/api/content`, contentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Content created successfully!');
      console.log('📊 Content response:', contentResponse.data);
      
      console.log('\n🎉 All tests passed! The step-by-step project creation flow should now work.');
      
    } catch (error) {
      if (error.response) {
        console.log('❌ API call failed with status:', error.response.status);
        console.log('📝 Error response:', error.response.data);
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
