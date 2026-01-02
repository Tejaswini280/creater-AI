import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

// Test configuration
const TEST_CONFIG = {
  serverUrl: 'ws://localhost:5000/ws',
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production"
};

// Create test token
const testUser = {
  id: "test-user-id-12345",
  email: "test@creatornexus.com",
  firstName: "Test",
  lastName: "User"
};

const testToken = jwt.sign(
  { 
    userId: testUser.id, 
    email: testUser.email,
    firstName: testUser.firstName,
    lastName: testUser.lastName
  },
  TEST_CONFIG.JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('🔍 Debugging Graceful Degradation Test');
console.log('=' .repeat(50));

// Test 1: Test with empty topic
function testEmptyTopic() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test 1: Empty topic validation...');
    
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${testToken}`);
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      console.log('❌ Timeout - no response received');
      ws.close();
      resolve(false);
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Send invalid configuration with empty topic
      const invalidMessage = {
        type: 'start_stream',
        streamType: 'script_generation',
        config: {
          topic: '', // Empty topic should trigger error
          platform: 'youtube',
          duration: '5min'
        }
      };
      
      console.log('📤 Sending invalid message:', JSON.stringify(invalidMessage, null, 2));
      ws.send(JSON.stringify(invalidMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received message:', JSON.stringify(message, null, 2));
        
        if (message.type === 'error') {
          messageReceived = true;
          console.log('✅ Error message received as expected');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        } else if (message.type === 'connection_established') {
          console.log('ℹ️ Connection established message received');
        } else {
          console.log('⚠️ Unexpected message type:', message.type);
        }
      } catch (error) {
        console.log('❌ Error parsing message:', error.message);
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}`);
      if (!messageReceived) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  });
}

// Test 2: Test with invalid stream type
function testInvalidStreamType() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test 2: Invalid stream type validation...');
    
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${testToken}`);
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      console.log('❌ Timeout - no response received');
      ws.close();
      resolve(false);
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Send invalid configuration with unknown stream type
      const invalidMessage = {
        type: 'start_stream',
        streamType: 'invalid_stream_type',
        config: {
          topic: 'Test topic',
          platform: 'youtube',
          duration: '5min'
        }
      };
      
      console.log('📤 Sending invalid message:', JSON.stringify(invalidMessage, null, 2));
      ws.send(JSON.stringify(invalidMessage));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received message:', JSON.stringify(message, null, 2));
        
        if (message.type === 'error') {
          messageReceived = true;
          console.log('✅ Error message received as expected');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        } else if (message.type === 'connection_established') {
          console.log('ℹ️ Connection established message received');
        } else {
          console.log('⚠️ Unexpected message type:', message.type);
        }
      } catch (error) {
        console.log('❌ Error parsing message:', error.message);
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}`);
      if (!messageReceived) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  });
}

// Run tests
async function runDebugTests() {
  console.log('🚀 Starting debug tests...\n');
  
  const test1Result = await testEmptyTopic();
  const test2Result = await testInvalidStreamType();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 DEBUG RESULTS');
  console.log('=' .repeat(50));
  console.log(`Test 1 (Empty Topic): ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Invalid Stream Type): ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
  
  if (test1Result && test2Result) {
    console.log('\n🎉 Both tests passed! Graceful degradation is working.');
  } else {
    console.log('\n⚠️ Some tests failed. Need to investigate further.');
  }
}

runDebugTests().catch(console.error);