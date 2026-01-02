const http = require('http');

console.log('🔍 Debugging Authentication State');
console.log('==================================');

// Test login and check auth state
async function debugAuthFlow() {
  console.log('\n1. Testing login...');
  
  // First, login to get authentication
  const loginData = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  return new Promise((resolve) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginResponseData = '';
      
      loginRes.on('data', chunk => loginResponseData += chunk);
      loginRes.on('end', () => {
        console.log(`Login Status: ${loginRes.statusCode}`);
        
        if (loginRes.statusCode === 200) {
          try {
            const loginResult = JSON.parse(loginResponseData);
            console.log('✅ Login successful');
            console.log('User:', loginResult.user?.email);
            console.log('Has accessToken:', !!loginResult.accessToken);
            console.log('Has refreshToken:', !!loginResult.refreshToken);
            
            // Extract cookies from login response
            const cookies = loginRes.headers['set-cookie'] || [];
            console.log('Cookies set:', cookies.length > 0 ? 'Yes' : 'No');
            if (cookies.length > 0) {
              cookies.forEach(cookie => {
                console.log('  Cookie:', cookie.split(';')[0]);
              });
            }
            
            // Now test the /api/auth/user endpoint
            console.log('\n2. Testing /api/auth/user endpoint...');
            
            const userCheckOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/auth/user',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                // Include cookies if they were set
                ...(cookies.length > 0 && { 'Cookie': cookies.map(c => c.split(';')[0]).join('; ') })
              }
            };
            
            const userReq = http.request(userCheckOptions, (userRes) => {
              let userData = '';
              userRes.on('data', chunk => userData += chunk);
              userRes.on('end', () => {
                console.log(`User check status: ${userRes.statusCode}`);
                
                if (userRes.statusCode === 200) {
                  try {
                    const user = JSON.parse(userData);
                    console.log('✅ User endpoint working');
                    console.log('User data:', user);
                  } catch (e) {
                    console.log('❌ User endpoint returned invalid JSON');
                  }
                } else {
                  console.log('❌ User endpoint failed');
                  console.log('Response:', userData);
                }
                
                console.log('\n3. Analysis:');
                if (loginResult.accessToken && loginResult.refreshToken) {
                  console.log('🔄 Server is in FALLBACK mode (returns tokens in response)');
                  console.log('   Frontend should store tokens in localStorage');
                  console.log('   This happens when database is not available');
                } else if (cookies.length > 0) {
                  console.log('🍪 Server is in NORMAL mode (uses httpOnly cookies)');
                  console.log('   Frontend should rely on cookies for authentication');
                } else {
                  console.log('❌ Authentication setup issue - no tokens or cookies');
                }
                
                resolve();
              });
            });
            
            userReq.on('error', (err) => {
              console.log('❌ User check request failed:', err.message);
              resolve();
            });
            
            userReq.end();
            
          } catch (e) {
            console.log('❌ Login response parsing failed');
            console.log('Raw response:', loginResponseData);
            resolve();
          }
        } else {
          console.log('❌ Login failed');
          console.log('Response:', loginResponseData);
          resolve();
        }
      });
    });

    loginReq.on('error', (err) => {
      console.log('❌ Login request failed:', err.message);
      resolve();
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

debugAuthFlow().catch(console.error);