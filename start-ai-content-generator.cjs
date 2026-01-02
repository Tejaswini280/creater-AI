const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Content Generator Application...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  require(packageJsonPath);
  console.log('✅ Found package.json');
} catch (error) {
  console.error('❌ package.json not found. Make sure you\'re in the project root directory.');
  process.exit(1);
}

// Start the development server
console.log('🔧 Starting development server...');
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devProcess.on('error', (error) => {
  console.error('❌ Failed to start development server:', error.message);
  
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure Node.js is installed');
  console.log('2. Run: npm install');
  console.log('3. Check if port 5000 is available');
  console.log('4. Verify environment variables in .env file');
});

devProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`\n❌ Development server exited with code ${code}`);
  } else {
    console.log('\n✅ Development server stopped gracefully');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  devProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n📋 Application Info:');
console.log('🌐 Frontend: http://localhost:5000');
console.log('🔗 AI Content Generator: http://localhost:5000/ai-content-generator');
console.log('🔑 Test Login: test@example.com / password123');
console.log('\n⏹️ Press Ctrl+C to stop the server');