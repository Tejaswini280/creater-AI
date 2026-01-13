#!/usr/bin/env node

// Simple build verification
console.log('🔍 Verifying build...');

const fs = require('fs');
const path = require('path');

// Check if dist directory exists
if (fs.existsSync('dist')) {
  console.log('✅ dist directory exists');
  
  // Check if main files exist
  const requiredFiles = ['index.js'];
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join('dist', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    console.log('🎉 Build verification passed!');
    process.exit(0);
  } else {
    console.log('❌ Build verification failed - missing files');
    process.exit(1);
  }
} else {
  console.log('❌ dist directory does not exist');
  process.exit(1);
}
