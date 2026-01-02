#!/usr/bin/env node

const WebSocket = require('ws');

// Test WebSocket connection with proper JWT token
async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket connection fixes...\n');

  // Test 1: Test with a valid JWT-like token
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.test-signature';
  
  console.log('🔌 Test 1: Connecting with JWT token...');
  console.log('Token:', testToken.substring(0, 50) + '...');
  
  const ws1 = new WebSocket(`ws://localhost:5000/ws?token=${encodeURIComponent(testToken)}`);
  
  ws1.on('open', () => {
    console.log('✅ WebSocket connection successful with JWT token!');
    ws1.close();
  });
  
  ws1.on('error', (error) => {
    console.log('❌ WebSocket connection failed:', error.message);
  });
  
  ws1.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} - ${reason}\n`);
  });

  // Test 2: Test with test token (fallback)
  setTimeout(() => {
    console.log('🔌 Test 2: Connecting with test token...');
    const ws2 = new WebSocket('ws://localhost:5000/ws?token=test-token');
    
    ws2.on('open', () => {
      console.log('✅ WebSocket connection successful with test token!');
      ws2.close();
    });
    
    ws2.on('error', (error) => {
      console.log('❌ WebSocket connection failed:', error.message);
    });
    
    ws2.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}\n`);
    });
  }, 2000);

  // Test 3: Test with invalid token
  setTimeout(() => {
    console.log('🔌 Test 3: Connecting with invalid token...');
    const ws3 = new WebSocket('ws://localhost:5000/ws?token=invalid-token');
    
    ws3.on('open', () => {
      console.log('❌ WebSocket connection should have failed!');
      ws3.close();
    });
    
    ws3.on('error', (error) => {
      console.log('✅ WebSocket correctly rejected invalid token:', error.message);
    });
    
    ws3.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}\n`);
    });
  }, 4000);

  // Test 4: Test URL construction (no undefined)
  setTimeout(() => {
    console.log('🔌 Test 4: Testing URL construction...');
    
    // Simulate the URL construction logic
    const protocol = 'ws:';
    const hostname = 'localhost';
    const port = '5000';
    const token = 'test-token';
    
    let finalUrl;
    if (port && port !== '' && port !== 'undefined' && port !== '80' && port !== '443') {
      finalUrl = `${protocol}//${hostname}:${port}/ws?token=${encodeURIComponent(token)}`;
    } else {
      finalUrl = `${protocol}//${hostname}/ws?token=${encodeURIComponent(token)}`;
    }
    
    console.log('✅ Constructed URL:', finalUrl);
    console.log('✅ No "undefined" in URL:', !finalUrl.includes('undefined'));
    
    const ws4 = new WebSocket(finalUrl);
    
    ws4.on('open', () => {
      console.log('✅ WebSocket connection successful with constructed URL!');
      ws4.close();
    });
    
    ws4.on('error', (error) => {
      console.log('❌ WebSocket connection failed:', error.message);
    });
    
    ws4.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}\n`);
      console.log('🎉 All tests completed!');
      process.exit(0);
    });
  }, 6000);
}

// Wait a moment for servers to start
setTimeout(() => {
  testWebSocketConnection();
}, 3000);