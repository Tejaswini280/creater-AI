const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

async function detailedAnalysis() {
  console.log('🔍 DETAILED CREATORNEXUS BACKEND ANALYSIS');
  console.log('=========================================\n');
  
  let authToken = null;
  const results = {
    authentication: {},
    database: {},
    features: {},
    apis: {},
    issues: []
  };
  
  // Test Authentication Flow
  console.log('🔐 Testing Authentication Flow...');
  
  try {
    // Test registration
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    console.log(`   Registration: ${registerResponse.status === 201 || registerResponse.status === 409 ? '✅ WORKING' : '❌ FAILED'} (${registerResponse.status})`);
    results.authentication.registration = registerResponse.status === 201 || registerResponse.status === 409;
    
    // Test login with test user
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@creatornexus.com',
        password: 'password'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;
      console.log('   ✅ Login: WORKING - Token obtained');
      results.authentication.login = true;
      results.authentication.hasToken = true;
    } else {
      console.log(`   ❌ Login: FAILED (${loginResponse.status})`);
      results.authentication.login = false;
      results.issues.push('Authentication system not working properly');
    }
    
  } catch (error) {
    console.log(`   ❌ Authentication Error: ${error.message}`);
    results.auth