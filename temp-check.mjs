
  import { db } from './server/db.ts';
  import { users, content, templates, notifications, aiGenerationTasks, contentMetrics, niches, socialAccounts } from './shared/schema.ts';
  
  async function checkDatabaseState() {
    try {
      const userCount = await db.select().from(users);
      const contentCount = await db.select().from(content);
      const templateCount = await db.select().from(templates);
      const notificationCount = await db.select().from(notifications);
      const taskCount = await db.select().from(aiGenerationTasks);
      const nicheCount = await db.select().from(niches);
      const socialAccountCount = await db.select().from(socialAccounts);
      
      console.log('Current Database State:');
      console.log('Users:', userCount.length);
      console.log('Content:', contentCount.length);
      console.log('Templates:', templateCount.length);
      console.log('Notifications:', notificationCount.length);
      console.log('AI Tasks:', taskCount.length);
      console.log('Niches:', nicheCount.length);
      console.log('Social Accounts:', socialAccountCount.length);
      
      // Check if we have sufficient data
      const hasSufficientData = userCount.length >= 50 && 
                               contentCount.length >= 50 && 
                               templateCount.length >= 50 && 
                               notificationCount.length >= 50 && 
                               taskCount.length >= 50 && 
                               nicheCount.length >= 20 && 
                               socialAccountCount.length >= 50;
      
      if (hasSufficientData) {
        console.log('✅ Database has sufficient data for Phase 4.2 testing');
        process.exit(0);
      } else {
        console.log('❌ Database needs more data for Phase 4.2 testing');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error checking database state:', error.message);
      process.exit(1);
    }
  }
  
  checkDatabaseState();
