import { db } from './server/db.js';

async function testDB() {
  try {
    console.log('Testing database connection...');
    const user = await db.query.users.findFirst();
    console.log('User found:', !!user);
    if (user) {
      console.log('User:', user.email);
    }
  } catch (error) {
    console.log('DB Error:', error.message);
  }
}

testDB();
