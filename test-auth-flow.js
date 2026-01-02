// Test authentication flow
console.log('Testing authentication flow...');

async function testAuth() {
  try {
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginData.accessToken) {
      console.log('2. Testing authentication with token...');
      const authResponse = await fetch('http://localhost:5000/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const authData = await authResponse.json();
      console.log('Auth response:', authData);

      if (authResponse.ok) {
        console.log('✅ Authentication successful!');
        return true;
      } else {
        console.log('❌ Authentication failed:', authData);
        return false;
      }
    } else {
      console.log('❌ Login failed to return token');
      return false;
    }
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

testAuth().then(success => {
  console.log('Test completed:', success ? 'SUCCESS' : 'FAILED');
});
