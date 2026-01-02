const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

async function createTestUser() {
  const client = new Client({
    connectionString: 'postgresql://postgres@localhost:5432/creators_dev_db'
  });

  try {
    await client.connect();
    
    const userId = nanoid();
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log('✅ Test user already exists!');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
      return;
    }

    // Create test user
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, email, hashedPassword, 'Test', 'User', true]);

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('🎉 LOGIN CREDENTIALS:');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('🌐 Access your application at: http://localhost:5000');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();