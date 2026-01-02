import { DatabaseStorage } from './server/storage.ts';

async function testStorageDirect() {
  console.log('🧪 Testing Storage Method Directly...\n');

  try {
    const storage = new DatabaseStorage();
    
    const testContent = {
      userId: 'test-user-id',
      title: 'Direct Storage Test',
      description: 'Testing storage method directly',
      platform: 'youtube',
      contentType: 'video',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      contentId: 'some-content-id', // This field doesn't exist in schema
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🔍 Calling createScheduledContent with data:', testContent);
    
    const result = await storage.createScheduledContent(testContent);
    
    console.log('✅ Storage method succeeded:', result);
    
  } catch (error) {
    console.error('❌ Storage method failed:', error.message);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Run the test
testStorageDirect();
