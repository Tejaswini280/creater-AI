import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function createNotificationsTable() {
  console.log('🔧 Creating notifications table...');
  
  try {
    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
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
    
    console.log('✅ Notifications table created successfully');
    
    // Create index on user_id for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    
    console.log('✅ Index created on user_id');
    
    // Verify table was created
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    console.log('Notifications table exists:', tableExists[0]?.exists);
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    throw error;
  }
}

createNotificationsTable()
  .then(() => {
    console.log('✅ Notifications table creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Notifications table creation failed:', error);
    process.exit(1);
  });
