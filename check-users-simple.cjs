const { Client } = require('pg');

async function checkUsers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'creators_dev_db',
    user: 'postgres',
    password: '',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const users = await client.query('SELECT id, email, first_name, last_name FROM users LIMIT 10');
    console.log('\n👥 Users in database:');
    users.rows.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.first_name} ${user.last_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers().catch(console.error);