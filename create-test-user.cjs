const { Client } = require('pg');
const { nanoid } = require('nanoid');

async function createTestUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/creators_dev_db'
  });

  try {
    await client.connect();
    
    const userId = nanoid();
    const email = 'test@creatornexus.dev';

    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log('✅ Passwordless test user already exists!');
      console.log('📧 Email: test@creatornexus.dev');
      console.log('🔐 Authentication: OAuth/Social login only');
      return;
    }

    // Create passwordless test user (OAuth system)
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, email, 'OAuth', 'TestUser', true]);

    console.log('✅ Passwordless test user created successfully!');
    console.log('');
    console.log('🎉 OAUTH LOGIN CREDENTIALS:');
    console.log('📧 Email: test@creatornexus.dev');
    console.log('🔐 Authentication: Use OAuth/Social login (Google, GitHub, etc.)');
    console.log('🚫 No password required - this is a passwordless OAuth system');
    console.log('');
    console.log('🌐 Access your application at: http://localhost:5000');

  } catch (error) {
    console.error('❌ Error creating passwordless test user:', error.message);
    console.log('ℹ️  This is non-critical for OAuth systems');
  } finally {
    await client.end();
  }
}

createTestUser();