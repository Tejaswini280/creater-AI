const http = require('http');

function makeRequest(method, path, data = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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

async function checkUser() {
  console.log('🔍 Checking user authentication...\n');

  try {
    // Test with the test token
    const response = await makeRequest('GET', '/api/user/profile', null, 'test-token');
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200) {
      console.log('✅ User authenticated successfully');
      console.log('User ID:', response.data.user?.id);
    } else {
      console.log('❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser();