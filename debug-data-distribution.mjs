import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Debugging data distribution...');

const debugScript = `
  import { db } from './server/db.ts';
  import { users, content, templates, notifications, aiGenerationTasks, niches, socialAccounts } from './shared/schema.ts';
  import { eq } from 'drizzle-orm';
  
  async function debugDataDistribution() {
    try {
      console.log('=== DATA DISTRIBUTION DEBUG ===');
      
      // Get all users
      const allUsers = await db.select().from(users);
      console.log('Total users:', allUsers.length);
      
      // Check content distribution
      const allContent = await db.select().from(content);
      console.log('Total content:', allContent.length);
      
      // Check which users have content
      const usersWithContent = new Set(allContent.map(c => c.userId));
      console.log('Users with content:', usersWithContent.size);
      console.log('Users without content:', allUsers.length - usersWithContent.size);
      
      // Find a user with content
      let userWithContent = null;
      for (const user of allUsers) {
        const userContent = await db.select().from(content).where(eq(content.userId, user.id));
        if (userContent.length > 0) {
          userWithContent = user;
          console.log('Found user with content:', user.id, 'Content count:', userContent.length);
          break;
        }
      }
      
      if (!userWithContent) {
        console.log('No users found with content!');
        return;
      }
      
      // Check other relationships for this user
      const userSocialAccounts = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userWithContent.id));
      const userTasks = await db.select().from(aiGenerationTasks).where(eq(aiGenerationTasks.userId, userWithContent.id));
      const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userWithContent.id));
      
      console.log('User relationships:');
      console.log('- Social accounts:', userSocialAccounts.length);
      console.log('- AI tasks:', userTasks.length);
      console.log('- Notifications:', userNotifications.length);
      
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Debug failed:', error.message);
    }
  }
  
  debugDataDistribution();
`;

fs.writeFileSync('temp-debug.mjs', debugScript);
execSync('npx tsx temp-debug.mjs', { encoding: 'utf8' });
fs.unlinkSync('temp-debug.mjs');
