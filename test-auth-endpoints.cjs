#!/usr/bin/env node

console.log('🧪 TESTING AUTH ENDPOINTS...');

async function testAuthEndpoints() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log(`✅ Health: ${healthResponse.status}`);
    
    // Test 2: Auth status (should return 401 when not logged in)
    console.log('\n2️⃣ Testing auth status endpoint...');
    const authResponse = await fetch(`${baseUrl}/api/auth/user`, {
      credentials: 'include'
    });
    console.log(`📊 Auth status: ${authResponse.status} (401 is expected when not logged in)`);
    
    // Test 3: Login endpoint
    console.log('\n3️⃣ Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log(`🔐 Login response: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('📋 Response keys:', Object.keys(loginData));
      
      // Test 4: Auth status after login
      console.log('\n4️⃣ Testing auth status after login...');
      const authAfterLogin = await fetch(`${baseUrl}/api/auth/user`, {
        credentials: 'include'
      });
      console.log(`📊 Auth after login: ${authAfterLogin.status}`);
      
      if (authAfterLogin.ok) {
        const userData = await authAfterLogin.json();
        console.log('✅ User data retrieved:', userData.email || userData.user?.email);
      }
      
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', errorText);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- If login returns 200: Auth endpoints are working');
    console.log('- If login returns 401: Check user credentials in database');
    console.log('- If login returns 500: Check server logs for errors');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Open: http://localhost:5000/fix-auth-redirect-instant.html');
    console.log('2. Click "Clear All Browser Storage"');
    console.log('3. Go to login page and try: test@example.com / password123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthEndpoints();