const fetch = require('node-fetch');

async function fixLoginIssue() {
  console.log('🔧 Fixing login issue...');
  
  try {
    // 1. Test server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (!healthResponse.ok) {
      throw new Error('Server health check failed');
    }
    console.log('✅ Server is healthy');
    
    // 2. Test login endpoint
    console.log('2️⃣ Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('📥 Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login endpoint working');
    } else {
      console.log('⚠️ Login endpoint returned:', loginResponse.status);
    }
    
    // 3. Test auth login endpoint (alternative)
    console.log('3️⃣ Testing auth login endpoint...');
    const authLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('📥 Auth login response status:', authLoginResponse.status);
    
    if (authLoginResponse.ok) {
      const authLoginData = await authLoginResponse.json();
      console.log('✅ Auth login endpoint working');
      
      // 4. Test protected endpoint with cookies
      console.log('4️⃣ Testing protected endpoint...');
      const cookies = authLoginResponse.headers.get('set-cookie');
      
      const userResponse = await fetch('http://localhost:5000/api/auth/user', {
        method: 'GET',
        headers: {
          'Cookie': cookies || '',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 User endpoint response status:', userResponse.status);
      
      if (userResponse.ok) {
        console.log('✅ Protected endpoint working with cookies');
      } else {
        console.log('⚠️ Protected endpoint failed with cookies');
      }
      
    } else {
      const authErrorData = await authLoginResponse.json();
      console.log('❌ Auth login failed:', authErrorData);
    }
    
    // 5. Create browser-ready instructions
    console.log('\n🎯 BROWSER INSTRUCTIONS:');
    console.log('========================');
    console.log('1. Open: http://localhost:5000/quick-login-test.html');
    console.log('2. Click "Test Login" button');
    console.log('3. If login works, navigate to: http://localhost:5000');
    console.log('4. You should see the dashboard');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    
    console.log('\n✅ Login issue diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure the server is running: npm run dev');
    console.log('2. Check if PostgreSQL is running');
    console.log('3. Try clearing browser cache and localStorage');
    console.log('4. Check browser console for JavaScript errors');
  }
}

fixLoginIssue();