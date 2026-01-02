import { execSync } from 'child_process';
import fs from 'fs';

const checkInvalidDataScript = `
import { db } from './server/db.ts';
import { users, content, templates, notifications, aiGenerationTasks, niches, socialAccounts } from './shared/schema.ts';

async function checkInvalidData() {
  try {
    console.log('Checking for invalid data in database...');
    
    // Check for invalid user emails
    const allUsers = await db.select().from(users);
    console.log('Total users:', allUsers.length);
    
    const invalidUsers = allUsers.filter(user => !user.email || !user.email.includes('@'));
    if (invalidUsers.length > 0) {
      console.log('Found invalid users:');
      invalidUsers.forEach(user => {
        console.log('- User ID:', user.id, 'Email:', user.email);
      });
    } else {
      console.log('No invalid users found');
    }
    
    // Check for invalid content
    const allContent = await db.select().from(content);
    console.log('Total content:', allContent.length);
    
    const invalidContent = allContent.filter(c => !c.title || c.title.length < 1);
    if (invalidContent.length > 0) {
      console.log('Found invalid content:', invalidContent.length);
    } else {
      console.log('No invalid content found');
    }
    
    // Check for invalid templates
    const allTemplates = await db.select().from(templates);
    console.log('Total templates:', allTemplates.length);
    
    const invalidTemplates = allTemplates.filter(t => !t.title || t.title.length < 1);
    if (invalidTemplates.length > 0) {
      console.log('Found invalid templates:', invalidTemplates.length);
    } else {
      console.log('No invalid templates found');
    }
    
    console.log('Invalid data check completed');
  } catch (error) {
    console.error('Error checking invalid data:', error.message);
    process.exit(1);
  }
}

checkInvalidData();
`;

fs.writeFileSync('check-invalid-data.ts', checkInvalidDataScript);

try {
  console.log('Running invalid data check...');
  const result = execSync('npx tsx check-invalid-data.ts', { encoding: 'utf8' });
  console.log('Check result:', result);
} catch (error) {
  console.error('Check failed:', error.message);
} finally {
  if (fs.existsSync('check-invalid-data.ts')) {
    fs.unlinkSync('check-invalid-data.ts');
  }
}
