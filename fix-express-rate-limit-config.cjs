#!/usr/bin/env node

// Fix for Express rate limiting configuration issue
// This addresses the "trust proxy" setting error

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Express rate limiting configuration...');

// Read the server index file
const serverIndexPath = path.join(__dirname, 'server', 'index.ts');

if (!fs.existsSync(serverIndexPath)) {
  console.error('❌ server/index.ts not found');
  process.exit(1);
}

let content = fs.readFileSync(serverIndexPath, 'utf8');

// Check if trust proxy is already set
if (content.includes('app.set(\'trust proxy\'')) {
  console.log('✅ Trust proxy setting already exists');
} else {
  // Add trust proxy setting after app creation
  const appCreationLine = 'const app = express();';
  const trustProxyConfig = `const app = express();

// Configure Express to trust proxy headers (required for Railway/production)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Railway, Heroku, etc.)
} else {
  app.set('trust proxy', false); // Don't trust proxy in development
}`;

  if (content.includes(appCreationLine)) {
    content = content.replace(appCreationLine, trustProxyConfig);
    fs.writeFileSync(serverIndexPath, content);
    console.log('✅ Added trust proxy configuration to server/index.ts');
  } else {
    console.log('⚠️ Could not find app creation line to add trust proxy config');
  }
}

console.log('🎉 Express rate limiting configuration fix completed!');