import { execSync } from 'child_process';
import fs from 'fs';

const cleanupInvalidDataScript = `
import { db } from './server/db.ts';
import { users, content, templates, notifications, aiGenerationTasks, niches, socialAccounts } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function cleanupInvalidData() {
  try {
    console.log('Cleaning up invalid data from database...');
    
    // Find and remove invalid users
    const allUsers = await db.select().from(users);
    const invalidUsers = allUsers.filter(user => !user.email || !user.email.includes('@'));
    
    if (invalidUsers.length > 0) {
      console.log('Found invalid users to remove:', invalidUsers.length);
      for (const invalidUser of invalidUsers) {
        console.log('Removing invalid user:', invalidUser.id, invalidUser.email);
        
        // Remove related data first (foreign key constraints)
        await db.delete(notifications).where(eq(notifications.userId, invalidUser.id));
        await db.delete(aiGenerationTasks).where(eq(aiGenerationTasks.userId, invalidUser.id));
        await db.delete(content).where(eq(content.userId, invalidUser.id));
        await db.delete(socialAccounts).where(eq(socialAccounts.userId, invalidUser.id));
        
        // Finally remove the user
        await db.delete(users).where(eq(users.id, invalidUser.id));
      }
      console.log('Invalid users removed successfully');
    } else {
      console.log('No invalid users found');
    }
    
    // Verify cleanup
    const remainingUsers = await db.select().from(users);
    const remainingInvalidUsers = remainingUsers.filter(user => !user.email || !user.email.includes('@'));
    
    if (remainingInvalidUsers.length === 0) {
      console.log('Cleanup successful - no invalid users remaining');
      console.log('Total valid users remaining:', remainingUsers.length);
    } else {
      console.log('Warning: Some invalid users still remain:', remainingInvalidUsers.length);
    }
    
    console.log('Invalid data cleanup completed');
  } catch (error) {
    console.error('Error cleaning up invalid data:', error.message);
    process.exit(1);
  }
}

cleanupInvalidData();
`;

fs.writeFileSync('cleanup-invalid-data.ts', cleanupInvalidDataScript);

try {
  console.log('Running invalid data cleanup...');
  const result = execSync('npx tsx cleanup-invalid-data.ts', { encoding: 'utf8' });
  console.log('Cleanup result:', result);
} catch (error) {
  console.error('Cleanup failed:', error.message);
} finally {
  if (fs.existsSync('cleanup-invalid-data.ts')) {
    fs.unlinkSync('cleanup-invalid-data.ts');
  }
}
