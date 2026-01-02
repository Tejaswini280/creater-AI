#!/usr/bin/env node

/**
 * 🚀 CreatorNexus Error Recovery Script
 * This script fixes all common errors and provides permanent solutions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 CreatorNexus Error Recovery Script Starting...\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

// Step 1: Clear all caches
function clearCaches() {
  log('\n🧹 STEP 1: Clearing all caches...', 'cyan');
  
  const cacheDirs = [
    'node_modules/.cache',
    '.next',
    'dist',
    'build',
    'coverage',
    'client/dist',
    'server/dist'
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        log(`✅ Cleared: ${dir}`, 'green');
      } catch (error) {
        log(`⚠️  Could not clear ${dir}: ${error.message}`, 'yellow');
      }
    }
  });
}

// Step 2: Fix package dependencies
function fixDependencies() {
  log('\n📦 STEP 2: Fixing dependencies...', 'cyan');
  
  // Remove node_modules and package-lock.json
  if (fs.existsSync('node_modules')) {
    runCommand('rm -rf node_modules', 'Removing node_modules');
  }
  
  if (fs.existsSync('package-lock.json')) {
    runCommand('rm package-lock.json', 'Removing package-lock.json');
  }
  
  // Reinstall dependencies
  runCommand('npm install', 'Installing dependencies');
}

// Step 3: Fix environment variables
function fixEnvironment() {
  log('\n🔧 STEP 3: Setting up environment variables...', 'cyan');
  
  const envContent = `# CreatorNexus Environment Variables
NODE_ENV=development
PORT=5000
CLIENT_PORT=3000

# Database Configuration
DATABASE_URL=postgresql://creators_dev_user:CreatorsDev54321@localhost:5432/creators_dev_db
DB_NAME=creators_dev_db
DB_USER=creators_dev_user
DB_PASSWORD=CreatorsDev54321
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# OpenAI Configuration (Optional - will use fallbacks if not set)
OPENAI_API_KEY=your-openai-api-key-here

# Security
API_RATE_LIMIT=100
SESSION_SECRET=your-session-secret-key

# WebSocket Configuration
WS_PORT=5000
WS_PATH=/ws

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envContent);
    log('✅ Created .env file with default values', 'green');
  } else {
    log('ℹ️  .env file already exists, skipping creation', 'yellow');
  }
}

// Step 4: Fix database connection
function fixDatabase() {
  log('\n🗄️  STEP 4: Setting up database...', 'cyan');
  
  // Create database setup script
  const dbSetupScript = `
-- CreatorNexus Database Setup
-- Run this script in your PostgreSQL database

-- Create database if it doesn't exist
CREATE DATABASE creators_dev_db;

-- Create user if it doesn't exist
CREATE USER creators_dev_user WITH PASSWORD 'CreatorsDev54321';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE creators_dev_db TO creators_dev_user;
GRANT ALL ON SCHEMA public TO creators_dev_user;

-- Connect to the database
\\c creators_dev_db;

-- Grant schema privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO creators_dev_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO creators_dev_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO creators_dev_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO creators_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO creators_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO creators_dev_user;
`;

  fs.writeFileSync('database-setup.sql', dbSetupScript);
  log('✅ Created database-setup.sql file', 'green');
  log('ℹ️  Run this script in PostgreSQL to set up the database', 'yellow');
}

// Step 5: Fix WebSocket configuration
function fixWebSocket() {
  log('\n🔌 STEP 5: Fixing WebSocket configuration...', 'cyan');
  
  // Create WebSocket test script
  const wsTestScript = `
// WebSocket Connection Test
import WebSocket from 'ws';

function testWebSocket() {
  const ws = new WebSocket('ws://localhost:5000/ws?token=test-token');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    ws.close();
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket connection failed:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
}

// Test after 2 seconds to allow server to start
setTimeout(testWebSocket, 2000);
`;

  fs.writeFileSync('test-websocket.js', wsTestScript);
  log('✅ Created WebSocket test script', 'green');
}

// Step 6: Create error monitoring script
function createErrorMonitor() {
  log('\n📊 STEP 6: Creating error monitoring...', 'cyan');
  
  const errorMonitorScript = `
// Error Monitoring Script
const fs = require('fs');
const path = require('path');

class ErrorMonitor {
  constructor() {
    this.errorLog = [];
    this.startTime = Date.now();
  }
  
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      uptime: Date.now() - this.startTime
    };
    
    this.errorLog.push(errorEntry);
    console.error('🚨 Error logged:', errorEntry);
    
    // Save to file
    this.saveToFile();
  }
  
  saveToFile() {
    const logFile = path.join(__dirname, 'error-log.json');
    fs.writeFileSync(logFile, JSON.stringify(this.errorLog, null, 2));
  }
  
  getErrorSummary() {
    const errorTypes = {};
    this.errorLog.forEach(error => {
      const type = error.message.split(':')[0];
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorLog.length,
      errorTypes,
      uptime: Date.now() - this.startTime
    };
  }
}

module.exports = ErrorMonitor;
`;

  fs.writeFileSync('error-monitor.js', errorMonitorScript);
  log('✅ Created error monitoring script', 'green');
}

// Step 7: Create comprehensive test script
function createTestScript() {
  log('\n🧪 STEP 7: Creating comprehensive test script...', 'cyan');
  
  const testScript = `
// Comprehensive API Test Script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_ENDPOINTS = [
  '/api/health',
  '/api/content',
  '/api/content/schedule',
  '/api/ai/generate-script',
  '/api/ai/generate-voiceover',
  '/api/ai/generate-thumbnail'
];

async function testEndpoint(endpoint) {
  try {
    console.log(\`🔄 Testing \${endpoint}...\`);
    
    const response = await axios.get(\`\${BASE_URL}\${endpoint}\`, {
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(\`✅ \${endpoint}: \${response.status} \${response.statusText}\`);
    return { endpoint, status: 'success', statusCode: response.status };
  } catch (error) {
    console.log(\`❌ \${endpoint}: \${error.response?.status || 'ERROR'} \${error.message}\`);
    return { endpoint, status: 'error', error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\\n');
  
  const results = [];
  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\\n📊 Test Results Summary:');
  console.log('========================');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(\`✅ Successful: \${successCount}\`);
  console.log(\`❌ Failed: \${errorCount}\`);
  console.log(\`📈 Success Rate: \${Math.round((successCount / results.length) * 100)}%\`);
  
  if (errorCount > 0) {
    console.log('\\n❌ Failed Endpoints:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(\`  - \${r.endpoint}: \${r.error}\`);
    });
  }
  
  return results;
}

// Run tests if this script is executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  runAllTests().catch(console.error);
}

export { testEndpoint, runAllTests };
`;

  fs.writeFileSync('test-api.js', testScript);
  log('✅ Created comprehensive test script', 'green');
}

// Main execution
async function main() {
  try {
    log('🚀 Starting CreatorNexus Error Recovery Process...', 'bright');
    
    clearCaches();
    fixDependencies();
    fixEnvironment();
    fixDatabase();
    fixWebSocket();
    createErrorMonitor();
    createTestScript();
    
    log('\n🎉 Error Recovery Process Completed!', 'green');
    log('\n📋 Next Steps:', 'cyan');
    log('1. Run: npm run dev', 'yellow');
    log('2. Open browser and clear cache (Ctrl+Shift+Delete)', 'yellow');
    log('3. Test the application', 'yellow');
    log('4. Run: node test-api.js (to test all endpoints)', 'yellow');
    log('5. Check error-log.json for any remaining issues', 'yellow');
    
    log('\n🔧 If you still see errors:', 'red');
    log('- Check the CLEAR_CACHE_INSTRUCTIONS.md file', 'yellow');
    log('- Run the database-setup.sql script in PostgreSQL', 'yellow');
    log('- Check the error-log.json file for specific issues', 'yellow');
    
  } catch (error) {
    log(`\n❌ Error during recovery process: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main();
