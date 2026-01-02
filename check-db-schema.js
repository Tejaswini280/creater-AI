import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check if notifications table exists
    const notificationsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    console.log('Notifications table exists:', notificationsCheck[0]?.exists);
    
    // List all tables
    const tablesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('All tables in database:');
    tablesCheck.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error checking database schema:', error);
  }
}

checkDatabaseSchema()
  .then(() => {
    console.log('✅ Database schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database schema check failed:', error);
    process.exit(1);
  });
