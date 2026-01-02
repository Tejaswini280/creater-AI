const pg = require('pg');
const bcrypt = require('bcrypt');

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'creators_dev_db',
  user: 'postgres',
  password: 'postgres'
});

async function basicSeed() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['test-user-1', 'test@example.com', hashedPassword, 'Test', 'User', true]);

    console.log('✅ Created test user:', userResult.rows[0].id);

    // Create a test project
    const projectResult = await client.query(`
      INSERT INTO projects (user_id, name, description, type, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [userResult.rows[0].id, 'Test Project', 'A test project for development', 'video', 'active']);

    console.log('✅ Created test project:', projectResult.rows[0].id);

    // Create some test content
    const contentResult = await client.query(`
      INSERT INTO content (user_id, title, description, platform, content_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [userResult.rows[0].id, 'Test Content', 'Test content description', 'youtube', 'video', 'draft']);

    console.log('✅ Created test content:', contentResult.rows[0].id);

    console.log('🎉 Basic seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

basicSeed();
