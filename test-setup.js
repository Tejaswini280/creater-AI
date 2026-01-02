import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import database setup (using dynamic import for ES modules)
async function getDatabaseSetup() {
  try {
    const { setupTestDatabase: dbSetup } = await import('./setup-test-db.js');
    return dbSetup;
  } catch (error) {
    console.warn('Database setup not available, using mock authentication');
    return null;
  }
}

// Test configuration
const TEST_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  TEST_USER: {
    id: "test-user-id-12345",
    email: "test@creatornexus.com",
    password: "testpassword123",
    firstName: "Test",
    lastName: "User"
  }
};

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(TEST_CONFIG.TEST_USER.password, 12);
    
    // Create test user object
    const testUser = {
      id: TEST_CONFIG.TEST_USER.id,
      email: TEST_CONFIG.TEST_USER.email,
      password: hashedPassword,
      firstName: TEST_CONFIG.TEST_USER.firstName,
      lastName: TEST_CONFIG.TEST_USER.lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('✅ Test user created successfully');
    console.log('User ID:', testUser.id);
    console.log('Email:', testUser.email);
    
    return testUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

function generateTestToken(user) {
  try {
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      TEST_CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Test JWT token generated successfully');
    console.log('Token:', token);
    
    return token;
  } catch (error) {
    console.error('❌ Error generating test token:', error);
    throw error;
  }
}

async function setupTestEnvironment() {
  console.log('🚀 Setting up test environment for WebSocket testing...');
  console.log('=' .repeat(60));
  
  try {
    let testUser;
    
    // Try to set up database if available
    const setupTestDatabase = await getDatabaseSetup();
    if (setupTestDatabase) {
      try {
        testUser = await setupTestDatabase();
        console.log('✅ Database setup completed');
      } catch (error) {
        console.warn('⚠️ Database setup failed, using mock user:', error.message);
        testUser = await createTestUser();
      }
    } else {
      // Create mock test user
      testUser = await createTestUser();
    }
    
    // Generate test token
    const testToken = generateTestToken(testUser);
    
    console.log('\n📋 Test Environment Summary:');
    console.log('=' .repeat(60));
    console.log(`User ID: ${testUser.id}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Token: ${testToken}`);
    console.log(`Token Expiry: 24 hours`);
    
    // Return for use in tests
    return { testUser, testToken };
    
    console.log('\n✅ Test environment setup complete!');
    console.log('You can now use the test token for WebSocket authentication.');
    
    return { testUser, testToken };
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestEnvironment()
    .then(() => {
      console.log('\n🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

export { setupTestEnvironment, createTestUser, generateTestToken }; 