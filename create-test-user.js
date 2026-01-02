import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const sql = postgres('postgresql://postgres@localhost:5432/creators_dev_db');

async function createTestUser() {
  try {
    const userId = nanoid();
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      console.log('✅ Test user already exists!');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
      return;
    }

    // Create test user
    await sql`
      INSERT INTO users (id, email, password, first_name, last_name, is_active)
      VALUES (${userId}, ${email}, ${hashedPassword}, 'Test', 'User', true)
    `;

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
    await sql.end();
  }
}

createTestUser();