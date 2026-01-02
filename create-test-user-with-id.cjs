const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createTestUser() {
  console.log('🚀 Creating test user with correct ID...\n');

  try {
    // First try to register a new user
    const registerData = {
      email: 'testuser@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    console.log('1. Registering new test user...');
    const registerResponse = await makeRequest('POST', '/api/auth/register', registerData);
    
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', registerResponse.data);

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ New user registered successfully');
      
      // Now login to get the token and user ID
      console.log('\n2. Logging in to get user details...');
      const loginResponse = await makeRequest('POST', '/api/auth/login', {
        email: 'testuser@example.com',
        password: 'password123'
      });

      console.log('Login Status:', loginResponse.status);
      console.log('Login Response:', loginResponse.data);

      if (loginResponse.status === 200 && loginResponse.data.accessToken) {
        console.log('✅ Login successful');
        console.log('🔑 Access Token:', loginResponse.data.accessToken);
        console.log('👤 User ID:', loginResponse.data.user?.id);
        
        return {
          token: loginResponse.data.accessToken,
          userId: loginResponse.data.user?.id
        };
      }
    } else if (registerResponse.status === 409) {
      console.log('ℹ️ User already exists, trying to login...');
      
      // Try to login with existing user
      const loginResponse = await makeRequest('POST', '/api/auth/login', {
        email: 'testuser@example.com',
        password: 'password123'
      });

      if (loginResponse.status === 200 && loginResponse.data.accessToken) {
        console.log('✅ Login successful with existing user');
        console.log('🔑 Access Token:', loginResponse.data.accessToken);
        console.log('👤 User ID:', loginResponse.data.user?.id);
        
        return {
          token: loginResponse.data.accessToken,
          userId: loginResponse.data.user?.id
        };
      }
    }

    return null;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  }
}

// Run the function
createTestUser().then(result => {
  if (result) {
    console.log('\n🎉 Test user ready for scheduler data seeding!');
    console.log('Use this token for API calls:', result.token);
  } else {
    console.log('\n❌ Failed to create/login test user');
  }
});