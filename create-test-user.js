import postgres from 'postgres';
import { nanoid } from 'nanoid';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/creators_dev_db');

async function createTestUser() {
  try {
    const userId = nanoid();
    const email = 'test@creatornexus.dev';

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      console.log('✅ Passwordless test user already exists!');
      console.log('📧 Email: test@creatornexus.dev');
      console.log('🔐 Authentication: OAuth/Social login only');
      return;
    }

    // Create passwordless test user (OAuth system)
    await sql`
      INSERT INTO users (id, email, first_name, last_name, is_active)
      VALUES (${userId}, ${email}, 'OAuth', 'TestUser', true)
    `;

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
    await sql.end();
  }
}

createTestUser();