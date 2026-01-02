import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function debugNotificationError() {
  console.log('🔍 Debugging notification creation error...');
  
  // First, get auth token
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'phase4test@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginResponse.json();
  const token = loginData.accessToken;
  
  console.log('✅ Got auth token');
  
  // Test notification creation with detailed error handling
  try {
    const notificationResponse = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });
    
    console.log('Response status:', notificationResponse.status);
    console.log('Response headers:', Object.fromEntries(notificationResponse.headers.entries()));
    
    const responseText = await notificationResponse.text();
    console.log('Response body:', responseText);
    
    if (notificationResponse.ok) {
      console.log('✅ Notification created successfully');
    } else {
      console.log('❌ Notification creation failed');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

debugNotificationError().catch(console.error);
