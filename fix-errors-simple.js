#!/usr/bin/env node

/**
 * 🚀 CreatorNexus Simple Error Recovery Script
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

// Step 2: Fix environment variables
function fixEnvironment() {
  log('\n🔧 STEP 2: Setting up environment variables...', 'cyan');
  
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

// Step 3: Create database setup script
function createDatabaseSetup() {
  log('\n🗄️  STEP 3: Creating database setup script...', 'cyan');
  
  const dbSetupScript = `-- CreatorNexus Database Setup
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

// Step 4: Create cache clearing instructions
function createCacheInstructions() {
  log('\n📋 STEP 4: Creating cache clearing instructions...', 'cyan');
  
  const instructions = `# 🧹 PERMANENT CACHE CLEARING SOLUTION

## 🚨 IMMEDIATE STEPS TO FIX CACHED ERRORS

### Step 1: Clear Browser Cache Completely
1. **Chrome/Edge:**
   - Press Ctrl + Shift + Delete
   - Select "All time" 
   - Check all boxes (Browsing history, Cookies, Cached images and files)
   - Click "Clear data"

2. **Firefox:**
   - Press Ctrl + Shift + Delete
   - Select "Everything"
   - Check all boxes
   - Click "Clear Now"

3. **Hard Refresh:**
   - Press Ctrl + F5 or Ctrl + Shift + R
   - This forces reload of all cached files

### Step 2: Clear Development Server Cache
\`\`\`bash
# Stop the development server (Ctrl+C)
# Clear all caches
npm run clean
# Or manually delete cache folders
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist
rm -rf build

# Restart development server
npm run dev
\`\`\`

### Step 3: Clear Browser Storage
1. Open Developer Tools (F12)
2. Go to Application tab
3. Under Storage, clear:
   - Local Storage
   - Session Storage
   - IndexedDB
   - Web SQL
   - Cookies

### Step 4: Disable Cache During Development
Add to your browser's Developer Tools:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Keep DevTools open while testing

## ✅ VERIFICATION STEPS

1. **Check Network Tab:**
   - All files should show status 200 (not 304)
   - No cached responses

2. **Check Console:**
   - No old error messages
   - Fresh logs from server

3. **Test Features:**
   - Content creation should work
   - WebSocket should connect properly
   - No 500 errors

## 🔄 PREVENTION MEASURES

1. **Always use versioned builds in production**
2. **Implement proper cache headers**
3. **Use content hashing for static assets**
4. **Test in incognito mode regularly**
5. **Monitor for cache-related issues**

---

**⚠️ IMPORTANT:** After clearing cache, restart both your development server and browser to ensure all changes take effect.
`;

  fs.writeFileSync('CACHE_CLEARING_INSTRUCTIONS.md', instructions);
  log('✅ Created cache clearing instructions', 'green');
}

// Main execution
async function main() {
  try {
    log('🚀 Starting CreatorNexus Error Recovery Process...', 'bright');
    
    clearCaches();
    fixEnvironment();
    createDatabaseSetup();
    createCacheInstructions();
    
    log('\n🎉 Error Recovery Process Completed!', 'green');
    log('\n📋 Next Steps:', 'cyan');
    log('1. Clear your browser cache completely (Ctrl+Shift+Delete)', 'yellow');
    log('2. Run: npm run dev', 'yellow');
    log('3. Test the application', 'yellow');
    log('4. Check CACHE_CLEARING_INSTRUCTIONS.md for detailed steps', 'yellow');
    
    log('\n🔧 If you still see errors:', 'red');
    log('- Follow the CACHE_CLEARING_INSTRUCTIONS.md file', 'yellow');
    log('- Run the database-setup.sql script in PostgreSQL', 'yellow');
    log('- Restart your development server', 'yellow');
    
  } catch (error) {
    log(`\n❌ Error during recovery process: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main();
