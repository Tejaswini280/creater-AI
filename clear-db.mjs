import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧹 Clearing database tables...');

const clearScript = `
  import { db } from './server/db.ts';
  import { users, content, templates, notifications, aiGenerationTasks, contentMetrics, niches, socialAccounts } from './shared/schema.ts';
  
  async function clearDatabase() {
    try {
      console.log('🗑️ Clearing all tables...');
      
      // Clear tables in reverse dependency order
      await db.delete(contentMetrics);
      await db.delete(socialAccounts);
      await db.delete(notifications);
      await db.delete(aiGenerationTasks);
      await db.delete(content);
      await db.delete(templates);
      await db.delete(niches);
      await db.delete(users);
      
      console.log('✅ Database cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      process.exit(1);
    }
  }
  
  clearDatabase();
`;

fs.writeFileSync('temp-clear.mjs', clearScript);
execSync('npx tsx temp-clear.mjs', { encoding: 'utf8' });
fs.unlinkSync('temp-clear.mjs');

console.log('✅ Database cleanup completed!');
