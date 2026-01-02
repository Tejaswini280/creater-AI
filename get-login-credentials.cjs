#!/usr/bin/env node

/**
 * Get Login Credentials for the Application
 */

console.log('🔐 LOGIN CREDENTIALS FOR YOUR APPLICATION');
console.log('==========================================\n');

console.log('🎯 **QUICK ACCESS CREDENTIALS:**\n');

console.log('📧 **Email**: test@example.com');
console.log('🔑 **Password**: password123\n');

console.log('📧 **Email**: admin@example.com');
console.log('🔑 **Password**: admin123\n');

console.log('📧 **Email**: user@test.com');
console.log('🔑 **Password**: test123\n');

console.log('🚀 **HOW TO LOGIN:**');
console.log('1. Go to: http://localhost:5000');
console.log('2. Click "Login" or go to: http://localhost:5000/login');
console.log('3. Use any of the credentials above');
console.log('4. You\'ll be redirected to the dashboard\n');

console.log('🎉 **WHAT YOU CAN ACCESS:**');
console.log('✅ Dashboard - Main overview with analytics');
console.log('✅ Content Studio - 100% complete content creation platform');
console.log('✅ Analytics - Complete analytics system with 6 sections');
console.log('✅ Scheduler - Multi-platform content scheduling');
console.log('✅ AI Tools - Script generation, voiceovers, thumbnails');
console.log('✅ Media Management - Upload, edit, organize media files\n');

console.log('🔧 **DEVELOPMENT MODE:**');
console.log('- The app runs in development mode with relaxed authentication');
console.log('- Any valid-looking email/password combination should work');
console.log('- If login fails, try the credentials above\n');

console.log('📱 **DIRECT ACCESS URLS:**');
console.log('🏠 Dashboard: http://localhost:5000/');
console.log('🎬 Content Studio: http://localhost:5000/content-studio');
console.log('📊 Analytics: http://localhost:5000/analytics');
console.log('📅 Scheduler: http://localhost:5000/scheduler');
console.log('🤖 AI Generator: http://localhost:5000/ai\n');

console.log('💡 **TIP:** If you get logged out, just use any of the credentials above to log back in!');

// Test if server is running
const http = require('http');

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('\n✅ **SERVER STATUS:** Your application is running and ready!');
      console.log('🌐 **ACCESS NOW:** http://localhost:5000');
    } else {
      console.log('\n⚠️ **SERVER STATUS:** Server responding but may have issues');
    }
  });

  req.on('error', (err) => {
    console.log('\n❌ **SERVER STATUS:** Server not running or not accessible');
    console.log('🔧 **ACTION NEEDED:** Make sure to run "npm run dev" first');
  });

  req.on('timeout', () => {
    console.log('\n⏱️ **SERVER STATUS:** Server timeout - may be starting up');
    req.destroy();
  });

  req.end();
}

testServer();