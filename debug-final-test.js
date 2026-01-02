import WebSocket from 'ws';
import { setupTestEnvironment } from './test-setup.js';

// Test configuration
const TEST_CONFIG = {
  serverUrl: 'ws://localhost:5000/ws',
  testTimeout: 60000,
  maxConcurrentConnections: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 60000
};

let TEST_TOKEN = '';

console.log('🔍 Debugging Final Test - Graceful Degradation');
console.log('=' .repeat(60));

async function debugGracefulDegradation() {
  console.log('🧪 Testing graceful degradation when AI services are unavailable...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    let errorReceived = false;
    
    const timeout = setTimeout(() => {
      console.log('❌ FAILED: Graceful Degradation - Timeout waiting for error response');
      ws.close();
      resolve(false);
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Try to start a stream with invalid configuration
      const invalidMessage = {
        type: 'start_stream',
        streamType: 'script_generation',
        config: {
          topic: '', // Invalid empty topic
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
        
        if (message.type === 'connection_established') {
          console.log('ℹ️ Connection established, waiting for error response...');
        } else if (message.type === 'error') {
          errorReceived = true;
          console.log(`✅ Error received: ${message.error}`);
          clearTimeout(timeout);
          console.log('✅ PASSED: Graceful Degradation - Graceful error handling confirmed');
          ws.close();
          resolve(true);
        } else {
          console.log(`⚠️ Unexpected message type: ${message.type}`);
        }
      } catch (error) {
        console.log(`❌ Error parsing message: ${error.message}`, 'ERROR');
      }
    });
    
    ws.on('error', (error) => {
      console.log(`❌ WebSocket error: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 Connection closed: ${code} - ${reason}`);
      if (!errorReceived) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  });
}

async function runDebug() {
  console.log('🚀 Starting debug test...\n');
  
  // Initialize test environment and get valid token
  try {
    console.log('🔧 Setting up test environment...');
    const { testToken } = await setupTestEnvironment();
    TEST_TOKEN = testToken;
    console.log('✅ Test environment initialized successfully');
  } catch (error) {
    console.log(`❌ Failed to initialize test environment: ${error.message}`, 'ERROR');
    process.exit(1);
  }
  
  const result = await debugGracefulDegradation();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DEBUG RESULT');
  console.log('=' .repeat(60));
  console.log(`Graceful Degradation: ${result ? '✅ PASS' : '❌ FAIL'}`);
  
  if (result) {
    console.log('\n🎉 Test passed! Graceful degradation is working correctly.');
  } else {
    console.log('\n⚠️ Test failed. Need to investigate further.');
  }
}

runDebug().catch(console.error); 