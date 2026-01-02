
      const { db } = require('./server/db');
      const { users, content, templates, notifications, aiGenerationTasks, contentMetrics, niches, socialAccounts } = require('./shared/schema');
      
      async function validateCounts() {
        try {
          const userCount = await db.select().from(users);
          const contentCount = await db.select().from(content);
          const templateCount = await db.select().from(templates);
          const notificationCount = await db.select().from(notifications);
          const taskCount = await db.select().from(aiGenerationTasks);
          const nicheCount = await db.select().from(niches);
          const socialAccountCount = await db.select().from(socialAccounts);
          
          console.log('Record Counts:');
          console.log('Users:', userCount.length);
          console.log('Content:', contentCount.length);
          console.log('Templates:', templateCount.length);
          console.log('Notifications:', notificationCount.length);
          console.log('AI Tasks:', taskCount.length);
          console.log('Niches:', nicheCount.length);
          console.log('Social Accounts:', socialAccountCount.length);
          
          if (userCount.length < 50) throw new Error('Users count < 50');
          if (contentCount.length < 50) throw new Error('Content count < 50');
          if (templateCount.length < 50) throw new Error('Templates count < 50');
          if (notificationCount.length < 50) throw new Error('Notifications count < 50');
          if (taskCount.length < 50) throw new Error('AI Tasks count < 50');
          if (nicheCount.length < 20) throw new Error('Niches count < 20');
          if (socialAccountCount.length < 50) throw new Error('Social Accounts count < 50');
          
          console.log('All record counts validated successfully!');
        } catch (error) {
          console.error('Validation failed:', error.message);
          process.exit(1);
        }
      }
      
      validateCounts();
    