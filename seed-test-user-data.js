import { db } from './server/db.ts';
import { content, contentMetrics, notifications } from './shared/schema.ts';
import { faker } from '@faker-js/faker';

// Configure faker for consistent data
faker.seed(12345);

async function seedTestUserData() {
  console.log('🌱 Seeding test user data for Phase 4...');
  
  const testUserId = 'hOJL5cvXF4AKHDs1rKCwL'; // From the test results
  
  try {
    // 1. Create test content for the user
    console.log('📹 Creating test content...');
    const contentData = Array.from({ length: 10 }, () => ({
      userId: testUserId,
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      script: faker.lorem.paragraphs(2),
      platform: faker.helpers.arrayElement(['youtube', 'instagram', 'facebook', 'tiktok', 'linkedin']),
      contentType: faker.helpers.arrayElement(['video', 'image', 'text', 'reel', 'short']),
      status: faker.helpers.arrayElement(['draft', 'scheduled', 'published', 'failed']),
      scheduledAt: faker.helpers.maybe(() => faker.date.future(), { probability: 0.3 }),
      publishedAt: faker.helpers.maybe(() => faker.date.past(), { probability: 0.4 }),
      thumbnailUrl: faker.image.url(),
      videoUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.7 }),
      tags: faker.helpers.arrayElements(['productivity', 'tech', 'fitness', 'cooking', 'travel', 'business', 'education', 'entertainment'], { min: 2, max: 6 }),
      metadata: {
        duration: faker.number.int({ min: 30, max: 1800 }),
        quality: faker.helpers.arrayElement(['720p', '1080p', '4k']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        category: faker.helpers.arrayElement(['tutorial', 'review', 'vlog', 'educational', 'entertainment'])
      },
      aiGenerated: faker.datatype.boolean(0.6)
    }));

    const insertedContent = await db.insert(content).values(contentData).returning();
    console.log(`✅ Created ${insertedContent.length} content pieces`);

    // 2. Create content metrics for the content
    console.log('📊 Creating content metrics...');
    const metricsData = insertedContent.map(c => ({
      contentId: c.id,
      platform: c.platform,
      views: faker.number.int({ min: 100, max: 1000000 }),
      likes: faker.number.int({ min: 10, max: 50000 }),
      comments: faker.number.int({ min: 0, max: 5000 }),
      shares: faker.number.int({ min: 0, max: 10000 }),
      engagementRate: faker.number.float({ min: 1.0, max: 15.0, fractionDigits: 1 }).toString(),
      revenue: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }).toString()
    }));

    const insertedMetrics = await db.insert(contentMetrics).values(metricsData).returning();
    console.log(`✅ Created ${insertedMetrics.length} content metrics`);

    // 3. Create notifications for the user
    console.log('🔔 Creating notifications...');
    const notificationTypes = ['info', 'success', 'warning', 'error'];
    const notificationTitles = [
      'Content Published Successfully',
      'Scheduled Content Reminder',
      'AI Credits Running Low',
      'Analytics Report Ready',
      'New Follower',
      'Comment Received',
      'Revenue Milestone',
      'System Update',
      'Backup Complete',
      'Security Alert'
    ];

    const notificationData = Array.from({ length: 15 }, () => ({
      userId: testUserId,
      type: faker.helpers.arrayElement(notificationTypes),
      title: faker.helpers.arrayElement(notificationTitles),
      message: faker.lorem.sentence(),
      isRead: faker.datatype.boolean(0.7),
      actionUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.6 }),
      metadata: {
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        category: faker.helpers.arrayElement(['content', 'system', 'analytics', 'security'])
      }
    }));

    const insertedNotifications = await db.insert(notifications).values(notificationData).returning();
    console.log(`✅ Created ${insertedNotifications.length} notifications`);

    console.log('🎉 Test user data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Content: ${insertedContent.length}`);
    console.log(`   - Metrics: ${insertedMetrics.length}`);
    console.log(`   - Notifications: ${insertedNotifications.length}`);

  } catch (error) {
    console.error('❌ Test user data seeding failed:', error);
    throw error;
  }
}

// Execute seeding
seedTestUserData()
  .then(() => {
    console.log('✅ Test user data seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test user data seeding failed:', error);
    process.exit(1);
  });
