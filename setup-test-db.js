import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Test user configuration
const TEST_USER = {
  id: "test-user-id-12345",
  email: "test@creatornexus.com",
  password: "testpassword123",
  firstName: "Test",
  lastName: "User"
};

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  
  try {
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, TEST_USER.id)
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists in database');
      return existingUser;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
    
    // Create test user
    const testUser = {
      id: TEST_USER.id,
      email: TEST_USER.email,
      password: hashedPassword,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert test user into database
    await db.insert(users).values(testUser);
    
    console.log('✅ Test user created in database');
    console.log('User ID:', testUser.id);
    console.log('Email:', testUser.email);
    
    return testUser;
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDatabase()
    .then(() => {
      console.log('\n🎉 Test database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test database setup failed:', error);
      process.exit(1);
    });
}

export { setupTestDatabase, TEST_USER }; 