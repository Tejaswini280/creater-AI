import { db } from './server/db.ts';
import { content, users } from './shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function testDatabase() {
  console.log('🧪 Testing Database Operations...\n');

  try {
    // Test 1: Check if we can query the content table
    console.log('1️⃣ Testing basic content table query...');
    const allContent = await db.select().from(content).limit(5);
    console.log('✅ Content table query successful');
    console.log(`📊 Found ${allContent.length} content items\n`);

    // Test 2: Check if test user exists, create if not
    console.log('2️⃣ Checking/Creating test user...');
    const testUserId = 'test-user-id';
    
    let testUser = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    if (testUser.length === 0) {
      console.log('📝 Test user not found, creating...');
      const [newUser] = await db
        .insert(users)
        .values({
          id: testUserId,
          email: 'test@example.com',
          password: 'hashed-password',
          firstName: 'Test',
          lastName: 'User',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log('✅ Test user created:', newUser.id);
      testUser = [newUser];
    } else {
      console.log('✅ Test user already exists:', testUser[0].id);
    }
    console.log('');

    // Test 3: Try to insert a test content
    console.log('3️⃣ Testing content insertion...');
    const testContent = {
      userId: testUserId,
      title: 'Database Test Content',
      description: 'This is a test content for database operations',
      platform: 'youtube',
      contentType: 'video',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [insertedContent] = await db
      .insert(content)
      .values(testContent)
      .returning();

    console.log('✅ Content insertion successful');
    console.log('📝 Inserted content ID:', insertedContent.id);
    console.log('📝 Inserted content title:', insertedContent.title);
    console.log('📝 Inserted content status:', insertedContent.status);
    console.log('');

    // Test 4: Query for scheduled content
    console.log('4️⃣ Testing scheduled content query...');
    const scheduledContent = await db
      .select()
      .from(content)
      .where(and(
        eq(content.userId, testUserId),
        eq(content.status, 'scheduled')
      ));

    console.log('✅ Scheduled content query successful');
    console.log(`📊 Found ${scheduledContent.length} scheduled content items`);
    
    if (scheduledContent.length > 0) {
      console.log('📋 Scheduled content items:');
      scheduledContent.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Title: ${item.title}, Status: ${item.status}`);
      });
    }

    console.log('\n🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Run the test
testDatabase(); 