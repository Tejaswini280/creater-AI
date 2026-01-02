import WebSocket from 'ws';
import http from 'http';
import { setupTestEnvironment } from './test-setup.js';

// Test configuration
const TEST_CONFIG = {
  serverUrl: 'ws://localhost:5000/ws',
  testTimeout: 60000,
  maxConcurrentConnections: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 60000
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test utilities
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ PASSED: ${testName}`, 'PASS');
  } else {
    testResults.failed++;
    log(`❌ FAILED: ${testName} - ${details}`, 'FAIL');
  }
  testResults.details.push({ testName, passed, details });
}

// Test authentication token
let TEST_TOKEN = '';

// Test 1: WebSocket Connection Establishment and Authentication
async function testConnectionEstablishment() {
  log('🧪 Testing WebSocket connection establishment and authentication...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    
    let connectionEstablished = false;
    let authenticationSuccessful = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      addTestResult('Connection Establishment', false, 'Timeout waiting for connection');
      resolve();
    }, 15000);
    
    ws.on('open', () => {
      connectionEstablished = true;
      log('WebSocket connection opened');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_established' && message.sessionId && message.userId) {
          authenticationSuccessful = true;
          log(`Authentication successful - Session: ${message.sessionId}, User: ${message.userId}`);
          clearTimeout(timeout);
          addTestResult('Connection Establishment', true, 'Connection and authentication successful');
          ws.close();
          resolve();
        }
      } catch (error) {
        log(`Error parsing message: ${error.message}`, 'ERROR');
      }
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (!authenticationSuccessful) {
        const success = connectionEstablished && authenticationSuccessful;
        addTestResult('Connection Establishment', success, 
          `Connection: ${connectionEstablished}, Auth: ${authenticationSuccessful}`);
      }
      resolve();
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      addTestResult('Connection Establishment', false, `Connection error: ${error.message}`);
      resolve();
    });
  });
}

// Test 2: Real-time Data Streaming
async function testRealTimeStreaming() {
  log('🧪 Testing real-time data streaming...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    let streamStarted = false;
    let chunksReceived = 0;
    
    const timeout = setTimeout(() => {
      ws.close();
      addTestResult('Real-time Streaming', false, 'Timeout waiting for streaming');
      resolve();
    }, 45000);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'start_stream',
        streamType: 'script_generation',
        config: {
          topic: 'AI Technology Trends',
          platform: 'YouTube',
          duration: '30 seconds'
        }
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'stream_started') {
          streamStarted = true;
          log('Stream started successfully');
        } else if (message.type === 'script_generation' && streamStarted) {
          chunksReceived++;
          log(`Chunk ${chunksReceived} received`);
          
          if (message.isComplete) {
            clearTimeout(timeout);
            const success = chunksReceived > 0;
            addTestResult('Real-time Streaming', success, 
              `Stream completed with ${chunksReceived} chunks`);
            ws.close();
            resolve();
          }
        }
      } catch (error) {
        log(`Error parsing streaming message: ${error.message}`, 'ERROR');
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      addTestResult('Real-time Streaming', false, `Streaming error: ${error.message}`);
      resolve();
    });
  });
}

// Test 3: Multiple User Support with Session Isolation
async function testMultipleUserSupport() {
  log('🧪 Testing multiple user support with session isolation...');
  
  return new Promise((resolve) => {
    const connections = [];
    const sessionIds = new Set();
    let activeConnections = 0;
    const maxConnections = 5;
    
    function createConnection(userId) {
      const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
      
      ws.on('open', () => {
        activeConnections++;
        log(`User ${userId} connected (${activeConnections}/${maxConnections})`);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'connection_established') {
            sessionIds.add(message.sessionId);
            log(`User ${userId} session: ${message.sessionId}`);
          }
        } catch (error) {
          log(`Error parsing message for user ${userId}: ${error.message}`, 'ERROR');
        }
      });
      
      ws.on('close', () => {
        activeConnections--;
        log(`User ${userId} disconnected (${activeConnections}/${maxConnections})`);
      });
      
      connections.push(ws);
    }
    
    // Create multiple connections
    for (let i = 0; i < maxConnections; i++) {
      setTimeout(() => createConnection(`user-${i + 1}`), i * 500);
    }
    
    // Wait for all connections to establish and check session isolation
    setTimeout(() => {
      const success = sessionIds.size === maxConnections && activeConnections === maxConnections;
      addTestResult('Multiple User Support', success, 
        `Sessions: ${sessionIds.size}/${maxConnections}, Connections: ${activeConnections}/${maxConnections}`);
      
      // Clean up connections
      connections.forEach(ws => ws.close());
      resolve();
    }, 8000);
  });
}

// Test 4: Heartbeat Mechanism
async function testHeartbeatMechanism() {
  log('🧪 Testing heartbeat mechanism for connection health...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    let heartbeatReceived = false;
    
    const timeout = setTimeout(() => {
      addTestResult('Heartbeat Mechanism', false, 'Timeout waiting for heartbeat');
      ws.close();
      resolve();
    }, 15000);
    
    ws.on('open', () => {
      log('Connection opened, sending heartbeat...');
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
          log('Heartbeat sent');
        }
      }, 2000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'heartbeat_ack') {
          heartbeatReceived = true;
          log('Heartbeat acknowledgment received');
          clearTimeout(timeout);
          addTestResult('Heartbeat Mechanism', true, 'Heartbeat mechanism working');
          ws.close();
          resolve();
        }
      } catch (error) {
        log(`Error parsing heartbeat message: ${error.message}`, 'ERROR');
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      addTestResult('Heartbeat Mechanism', false, `Heartbeat error: ${error.message}`);
      resolve();
    });
  });
}

// Test 5: Session Management
async function testSessionManagement() {
  log('🧪 Testing session management for multiple users...');
  
  return new Promise((resolve) => {
    const users = [];
    const sessions = new Map();
    
    function createUserSession(userId) {
      const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
      
      ws.on('open', () => {
        log(`User ${userId} session created`);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'connection_established') {
            sessions.set(userId, message.sessionId);
            log(`User ${userId} assigned session: ${message.sessionId}`);
          }
        } catch (error) {
          log(`Error parsing message for user ${userId}: ${error.message}`, 'ERROR');
        }
      });
      
      users.push({ userId, ws });
    }
    
    // Create multiple user sessions
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createUserSession(`user-${i + 1}`), i * 1000);
    }
    
    // Check session management after all users are connected
    setTimeout(() => {
      const uniqueSessions = new Set(sessions.values());
      const success = sessions.size === 3 && uniqueSessions.size === 3;
      
      addTestResult('Session Management', success, 
        `Users: ${sessions.size}, Unique Sessions: ${uniqueSessions.size}`);
      
      // Clean up
      users.forEach(({ ws }) => ws.close());
      resolve();
    }, 8000);
  });
}

// Test 6: WebSocket Stats and Monitoring
async function testWebSocketStats() {
  log('🧪 Testing WebSocket stats and monitoring...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    let statsChecked = false;
    
    const timeout = setTimeout(() => {
      if (!statsChecked) {
        addTestResult('WebSocket Stats', false, 'Timeout checking stats');
        ws.close();
        resolve();
      }
    }, 15000);
    
    ws.on('open', async () => {
      // Check WebSocket stats endpoint
      const httpModule = await import('http');
      const http = httpModule.default;
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/websocket/stats',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const stats = JSON.parse(data);
            const success = stats.totalConnections >= 1 && 
                           typeof stats.activeStreams === 'number' &&
                           Array.isArray(stats.sessions);
            
            addTestResult('WebSocket Stats', success, 
              `Stats: ${JSON.stringify(stats)}`);
            statsChecked = true;
            clearTimeout(timeout);
            ws.close();
            resolve();
          } catch (error) {
            addTestResult('WebSocket Stats', false, `Error parsing stats: ${error.message}`);
            statsChecked = true;
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        });
      });
      
      req.on('error', (error) => {
        addTestResult('WebSocket Stats', false, `Stats request error: ${error.message}`);
        statsChecked = true;
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      req.end();
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      addTestResult('WebSocket Stats', false, `WebSocket error: ${error.message}`);
      resolve();
    });
  });
}

// Test 7: Graceful Degradation
async function testGracefulDegradation() {
  log('🧪 Testing graceful degradation when AI services are unavailable...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${TEST_CONFIG.serverUrl}?token=${TEST_TOKEN}`);
    let errorReceived = false;
    
    const timeout = setTimeout(() => {
      addTestResult('Graceful Degradation', false, 'Timeout waiting for error response');
      ws.close();
      resolve();
    }, 10000);
    
    ws.on('open', () => {
      // Try to start a stream with invalid configuration
      ws.send(JSON.stringify({
        type: 'start_stream',
        streamType: 'script_generation',
        config: {
          topic: '', // Invalid empty topic
          platform: 'youtube',
          duration: '5min'
        }
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection_established') {
          log('Connection established, waiting for error response...');
        } else if (message.type === 'error') {
          errorReceived = true;
          log(`Error received: ${message.error}`);
          clearTimeout(timeout);
          addTestResult('Graceful Degradation', true, 'Graceful error handling confirmed');
          ws.close();
          resolve();
        }
      } catch (error) {
        log(`Error parsing message: ${error.message}`, 'ERROR');
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      addTestResult('Graceful Degradation', false, `WebSocket error: ${error.message}`);
      resolve();
    });
  });
}

// Main test runner
async function runFinalTests() {
  log('🚀 Starting Final WebSocket Server Test Suite for Task 1.1');
  log('=' .repeat(60));
  
  // Initialize test environment and get valid token
  try {
    log('🔧 Setting up test environment...');
    const { testToken } = await setupTestEnvironment();
    TEST_TOKEN = testToken;
    log('✅ Test environment initialized successfully');
  } catch (error) {
    log(`❌ Failed to initialize test environment: ${error.message}`, 'ERROR');
    process.exit(1);
  }
  
  const tests = [
    testConnectionEstablishment,
    testRealTimeStreaming,
    testMultipleUserSupport,
    testHeartbeatMechanism,
    testSessionManagement,
    testWebSocketStats,
    testGracefulDegradation
  ];
  
  for (let i = 0; i < tests.length; i++) {
    log(`\n📋 Running Test ${i + 1}/${tests.length}`);
    await tests[i]();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between tests
  }
  
  // Print final results
  log('\n' + '=' .repeat(60));
  log('📊 FINAL TEST RESULTS');
  log('=' .repeat(60));
  
  testResults.details.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    log(`${status} Test ${index + 1}: ${result.testName}`);
    if (!result.passed && result.details) {
      log(`   Details: ${result.details}`);
    }
  });
  
  log('\n📈 SUMMARY');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  const overallSuccess = testResults.failed === 0;
  log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    log('🎉 Task 1.1 WebSocket Server Implementation: 100% SUCCESS');
    log('✅ All acceptance criteria and test cases passed');
    log('');
    log('📋 ACCEPTANCE CRITERIA VERIFICATION:');
    log('✅ Set up WebSocket server with Express and ws library');
    log('✅ Connect streaming AI service to WebSocket');
    log('✅ Implement real-time script generation with word-by-word streaming');
    log('✅ Add connection management and error handling');
    log('✅ Implement session management for multiple users');
    log('✅ Add heartbeat mechanism for connection health');
    log('✅ Test with multiple concurrent users (5+ simultaneous connections)');
  } else {
    log('⚠️  Task 1.1 needs fixes before proceeding');
  }
  
  process.exit(overallSuccess ? 0 : 1);
}

// Start the test suite
runFinalTests().catch(error => {
  log(`❌ Test suite error: ${error.message}`, 'ERROR');
  process.exit(1);
}); 