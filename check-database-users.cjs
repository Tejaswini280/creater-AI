const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users } = require('./server/db/schema.ts');

async function checkUsers() {
  console.log('🔍 Checking database users...\n');

  try {
    // Connect to database
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/social_media_db';
    const sql = postgres(connectionString);
    const db = drizzle(sql);

    // Get all users
    const allUsers = await db.select().from(users);
    
    console.log(`Found ${allUsers.length} users in database:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
    });

    await sql.end();

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers();