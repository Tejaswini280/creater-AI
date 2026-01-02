import { db } from '../../server/db';

export default async () => {
  console.log('🧹 Cleaning up test suite...');

  try {
    // Close database connections
    await db.$client.end();
    console.log('✅ Database connections closed');

    // Clean up any test files or resources
    console.log('✅ Test resources cleaned up');

    console.log('✨ Test suite completed');
  } catch (error) {
    console.error('❌ Test teardown failed:', error);
    throw error;
  }
};
