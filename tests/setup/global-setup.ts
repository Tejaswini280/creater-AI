import { db } from '../../server/db';

export default async () => {
  console.log('🚀 Starting test suite...');

  try {
    // Verify database connection
    await db.execute('SELECT 1');
    console.log('✅ Database connection verified for tests');

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/creatornexus_test';

    // Disable rate limiting for tests
    process.env.SKIP_RATE_LIMIT = '1';

    console.log('✅ Test environment configured');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
};
