import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { notifications } from './shared/schema.ts';

async function fixNotificationsTable() {
  console.log('🔧 Fixing notifications table...');
  
  try {
    // Drop existing table if it exists
    await db.execute(sql`DROP TABLE IF EXISTS notifications CASCADE;`);
    console.log('✅ Dropped existing notifications table');
    
    // Create table using Drizzle schema
    await db.execute(sql`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        action_url VARCHAR,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Created notifications table with proper schema');
    
    // Create index for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    
    console.log('✅ Created index on user_id');
    
    // Test inserting a notification
    const testNotification = await db.insert(notifications).values({
      userId: 'hOJL5cvXF4AKHDs1rKCwL', // Test user ID
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to verify the table works',
      isRead: false
    }).returning();
    
    console.log('✅ Test notification created:', testNotification[0]);
    
    // Clean up test notification
    await db.delete(notifications).where(sql`id = ${testNotification[0].id}`);
    console.log('✅ Test notification cleaned up');
    
  } catch (error) {
    console.error('❌ Error fixing notifications table:', error);
    throw error;
  }
}

fixNotificationsTable()
  .then(() => {
    console.log('✅ Notifications table fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Notifications table fix failed:', error);
    process.exit(1);
  });
