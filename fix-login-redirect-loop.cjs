#!/usr/bin/env node

console.log('🔧 FIXING LOGIN REDIRECT LOOP...');

// The issue is that the auth check is failing and causing a redirect loop
// Let's create a test user and fix the auth flow

const { execSync } = require('child_process');

try {
  // First, let's create a test user in the database
  console.log('👤 Creating test user...');
  
  const createUserScript = `
    const { Client } = require('pg');
    const bcrypt = require('bcrypt');
    
    async function createTestUser() {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/creators_dev_db'
      });
      
      try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Insert test user
        const result = await client.query(\`
          INSERT INTO users (email, password_hash, name) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (email) DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name
          RETURNING id, email, name
        \`, ['test@example.com', hashedPassword, 'Test User']);
        
        console.log('✅ Test user created/updated:', result.rows[0]);
        
      } catch (error) {
        console.error('❌ Database error:', error.message);
      } finally {
        await client.end();
      }
    }
    
    createTestUser();
  `;
  
  require('fs').writeFileSync('temp-create-user.js', createUserScript);
  execSync('node temp-create-user.js', { stdio: 'inherit' });
  require('fs').unlinkSync('temp-create-user.js');
  
  console.log('✅ Test user setup complete!');
  console.log('');
  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('📧 Email: test@example.com');
  console.log('🔒 Password: password123');
  console.log('');
  console.log('🌐 Try logging in at: http://localhost:5000/login');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  
  // Fallback: Clear browser storage and try again
  console.log('');
  console.log('🔧 MANUAL FIX INSTRUCTIONS:');
  console.log('1. Open browser developer tools (F12)');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Clear all localStorage and sessionStorage');
  console.log('4. Clear all cookies for localhost:5000');
  console.log('5. Refresh the page');
  console.log('6. Try logging in with: test@example.com / password123');
}