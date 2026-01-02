import { db } from './db';
import { users, content, templates, aiGenerationTasks, contentMetrics, niches } from '@shared/schema';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

// Configure faker for consistent data
faker.seed(12345);

async function clearAndSimpleSeedDatabase() {
  console.log('🗑️ Clearing existing data...');
  
  try {
    // Clear all tables in the correct order (respecting foreign key constraints)
    await db.execute(sql`DELETE FROM content_metrics`);
    await db.execute(sql`DELETE FROM ai_generation_tasks`);
    await db.execute(sql`DELETE FROM content`);
    await db.execute(sql`DELETE FROM templates`);
    await db.execute(sql`DELETE FROM niches`);
    await db.execute(sql`DELETE FROM social_accounts`);
    await db.execute(sql`DELETE FROM users`);
    
    console.log('✅ Existing data cleared successfully');
    
    // Now seed the database
    await simpleSeedDatabase();
    
  } catch (error) {
    console.error('❌ Database clearing/seeding failed:', error);
    throw error;
  }
}

async function simpleSeedDatabase() {
  console.log('🌱 Starting simple database seeding...');
  
  const seededData = {
    userIds: [],
    contentIds: [],
    templateIds: [],
    taskIds: [],
    nicheIds: []
  };

  try {
    // 1. Seed Users (50+ realistic users)
    console.log('👥 Seeding users...');
    const userData = Array.from({ length: 50 }, () => ({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: bcrypt.hashSync('password123', 10),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      profileImageUrl: faker.image.avatar(),
      isActive: faker.datatype.boolean(0.9), // 90% active
    }));

    const insertedUsers = await db.insert(users).values(userData).returning();
    seededData.userIds = insertedUsers.map(u => u.id);
    console.log(`✅ Seeded ${insertedUsers.length} users`);

    // 2. Seed Templates (50+ diverse templates)
    console.log('📝 Seeding templates...');
    const templateCategories = ['video', 'thumbnail', 'script', 'branding', 'social'];
    const templateTypes = ['Script Template', 'Video Template', 'Thumbnail Template', 'Branding Kit', 'Social Media Template'];
    
    const templateData = Array.from({ length: 50 }, () => {
      const category = faker.helpers.arrayElement(templateCategories);
      const type = faker.helpers.arrayElement(templateTypes);
      
      return {
        title: faker.commerce.productName(),
        description: `Professional ${category} template for content creators. This template provides a solid foundation for creating engaging ${category} content that resonates with your audience.`,
        category,
        type,
        content: `# ${faker.commerce.productName()} Template

## Introduction
Welcome to this comprehensive ${category} template designed for content creators. This template will help you create engaging, professional content that drives results.

## Key Features
- Professional structure and formatting
- Engaging content hooks
- Call-to-action elements
- Audience engagement strategies
- Platform optimization tips

## Content Structure
1. **Hook**: Capture attention in the first 10 seconds
2. **Value**: Provide immediate value to your audience
3. **Story**: Share relevant experiences or examples
4. **Action**: Clear call-to-action for engagement
5. **Follow-up**: Plan for continued audience interaction

## Best Practices
- Keep content concise and focused
- Use visual elements to enhance engagement
- Include relevant hashtags and keywords
- Optimize for your target platform
- Engage with your audience in comments

## Customization Tips
- Adapt the tone to match your brand voice
- Modify examples to fit your niche
- Adjust length based on platform requirements
- Add personal anecdotes for authenticity
- Include current trends and references

This template is designed to be flexible and adaptable for various content types and platforms.`,
        thumbnailUrl: faker.image.url(),
        rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }).toString(),
        downloads: faker.number.int({ min: 0, max: 10000 }),
        isActive: faker.datatype.boolean(0.95),
        isFeatured: faker.datatype.boolean(0.2),
        tags: faker.helpers.arrayElements(['productivity', 'tech', 'fitness', 'cooking', 'travel', 'business', 'education', 'entertainment'], { min: 2, max: 5 }) as string[],
        metadata: {
          difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
          duration: faker.number.int({ min: 5, max: 60 }),
          platform: faker.helpers.arrayElement(['youtube', 'instagram', 'tiktok', 'linkedin'])
        }
      };
    });

    const insertedTemplates = await db.insert(templates).values(templateData).returning();
    seededData.templateIds = insertedTemplates.map(t => t.id);
    console.log(`✅ Seeded ${insertedTemplates.length} templates`);

    // 3. Seed Content (50+ diverse content pieces)
    console.log('📹 Seeding content...');
    const platforms = ['youtube', 'instagram', 'facebook', 'tiktok', 'linkedin'];
    const contentTypes = ['video', 'image', 'text', 'reel', 'short'];
    const statuses = ['draft', 'scheduled', 'published', 'failed'];

    const contentData = Array.from({ length: 50 }, () => {
      const userId = faker.helpers.arrayElement(seededData.userIds);
      const platform = faker.helpers.arrayElement(platforms);
      const contentType = faker.helpers.arrayElement(contentTypes);
      const status = faker.helpers.arrayElement(statuses);
      
      const contentTitles = [
        "10 Productivity Hacks That Actually Work",
        "The Future of AI in Content Creation",
        "How to Build a Personal Brand on Social Media",
        "5 Morning Routines of Successful Entrepreneurs",
        "The Complete Guide to YouTube SEO",
        "TikTok Marketing Strategies for 2024",
        "Instagram Reels: From Zero to Viral",
        "LinkedIn Content Strategy for Professionals",
        "How to Create Engaging Thumbnails",
        "The Psychology of Viral Content"
      ];
      
      const contentDescriptions = [
        "Discover proven productivity techniques that successful creators use to maximize their output and achieve their goals.",
        "Explore how artificial intelligence is revolutionizing content creation and what it means for creators.",
        "Learn the essential strategies for building a strong personal brand across all social media platforms.",
        "Discover the morning routines that set successful entrepreneurs apart and how to implement them.",
        "Master YouTube SEO to increase your video visibility and grow your channel faster.",
        "Stay ahead of the competition with these cutting-edge TikTok marketing strategies.",
        "Learn the secrets to creating Instagram Reels that go viral and drive engagement.",
        "Develop a professional LinkedIn content strategy that builds your authority and network.",
        "Master the art of creating thumbnails that drive clicks and increase your video performance.",
        "Understand the psychological principles behind viral content and how to apply them."
      ];
      
      return {
        userId,
        title: faker.helpers.arrayElement(contentTitles),
        description: faker.helpers.arrayElement(contentDescriptions),
        script: `# ${faker.helpers.arrayElement(contentTitles)}

## Introduction
Welcome to this comprehensive guide on ${faker.helpers.arrayElement(['content creation', 'social media marketing', 'productivity', 'personal branding'])}. Today, we're going to dive deep into strategies that actually work.

## Key Points
1. **Start with a Strong Foundation**: Understanding the basics is crucial for long-term success
2. **Consistency is Key**: Regular posting and engagement build trust with your audience
3. **Quality Over Quantity**: Focus on creating valuable content rather than just posting frequently
4. **Engage with Your Community**: Respond to comments and build relationships with your audience
5. **Analyze and Optimize**: Use data to understand what works and improve your strategy

## Action Steps
- Set clear goals for your content strategy
- Create a content calendar and stick to it
- Engage with your audience regularly
- Track your performance metrics
- Continuously learn and adapt your approach

## Conclusion
Remember, success in content creation is a marathon, not a sprint. Focus on providing value to your audience and building genuine connections.`,
        platform,
        contentType,
        status,
        scheduledAt: status === 'scheduled' ? faker.date.future() : null,
        publishedAt: status === 'published' ? faker.date.past() : null,
        thumbnailUrl: faker.image.url(),
        videoUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.7 }),
        tags: faker.helpers.arrayElements(['productivity', 'tech', 'fitness', 'cooking', 'travel', 'business', 'education', 'entertainment'], { min: 2, max: 6 }) as string[],
        metadata: {
          duration: faker.number.int({ min: 30, max: 1800 }),
          quality: faker.helpers.arrayElement(['720p', '1080p', '4k']),
          language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
          category: faker.helpers.arrayElement(['tutorial', 'review', 'vlog', 'educational', 'entertainment'])
        },
        aiGenerated: faker.datatype.boolean(0.6)
      };
    });

    const insertedContent = await db.insert(content).values(contentData).returning();
    seededData.contentIds = insertedContent.map(c => c.id);
    console.log(`✅ Seeded ${insertedContent.length} content pieces`);

    // 4. Seed Content Metrics (50+ metrics records)
    console.log('📊 Seeding content metrics...');
    const metricsData = Array.from({ length: 50 }, () => {
      const contentId = faker.helpers.arrayElement(seededData.contentIds);
      const platform = faker.helpers.arrayElement(platforms);
      
      return {
        contentId,
        platform,
        views: faker.number.int({ min: 100, max: 1000000 }),
        likes: faker.number.int({ min: 10, max: 50000 }),
        comments: faker.number.int({ min: 0, max: 5000 }),
        shares: faker.number.int({ min: 0, max: 10000 }),
        engagementRate: faker.number.float({ min: 1.0, max: 15.0, fractionDigits: 1 }).toString(),
        revenue: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }).toString()
      };
    });

    const insertedMetrics = await db.insert(contentMetrics).values(metricsData).returning();
    console.log(`✅ Seeded ${insertedMetrics.length} content metrics`);

    // 5. Seed AI Generation Tasks (50+ AI tasks)
    console.log('🤖 Seeding AI generation tasks...');
    const taskTypes = ['script', 'voiceover', 'video', 'thumbnail'];
    const taskStatuses = ['pending', 'processing', 'completed', 'failed'];

    const taskData = Array.from({ length: 50 }, () => {
      const userId = faker.helpers.arrayElement(seededData.userIds);
      const taskType = faker.helpers.arrayElement(taskTypes);
      const status = faker.helpers.arrayElement(taskStatuses);
      
      return {
        userId,
        taskType,
        prompt: faker.lorem.sentence(),
        result: status === 'completed' ? faker.lorem.paragraphs(2) : null || null,
        status,
        metadata: {
          model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'dall-e-3', 'whisper']),
          tokens: faker.number.int({ min: 100, max: 2000 }),
          duration: faker.number.int({ min: 5, max: 300 })
        },
        completedAt: status === 'completed' ? faker.date.past() : null
      };
    });

    const insertedTasks = await db.insert(aiGenerationTasks).values(taskData).returning();
    seededData.taskIds = insertedTasks.map(t => t.id);
    console.log(`✅ Seeded ${insertedTasks.length} AI generation tasks`);

    // 6. Seed Niches (50+ niches)
    console.log('🎯 Seeding niches...');
    const nicheCategories = ['technology', 'health', 'finance', 'education', 'entertainment', 'lifestyle', 'business', 'sports'];
    const difficulties = ['easy', 'medium', 'hard'];
    const profitabilities = ['low', 'medium', 'high'];

    const nicheData = Array.from({ length: 50 }, (_, index) => {
      const category = faker.helpers.arrayElement(nicheCategories);
      const difficulty = faker.helpers.arrayElement(difficulties);
      const profitability = faker.helpers.arrayElement(profitabilities);
      
      return {
        name: `${faker.commerce.department()} ${index + 1}`, // Make names unique
        category,
        trendScore: faker.number.int({ min: 0, max: 100 }),
        difficulty,
        profitability,
        keywords: faker.helpers.arrayElements([
          'productivity', 'tech', 'fitness', 'cooking', 'travel', 'business', 
          'education', 'entertainment', 'health', 'finance', 'lifestyle', 'sports'
        ], { min: 3, max: 8 }),
        description: faker.lorem.paragraph(),
        isActive: faker.datatype.boolean(0.9)
      };
    });

    const insertedNiches = await db.insert(niches).values(nicheData).returning();
    seededData.nicheIds = insertedNiches.map(n => n.id);
    console.log(`✅ Seeded ${insertedNiches.length} niches`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${seededData.userIds.length}`);
    console.log(`   - Templates: ${seededData.templateIds.length}`);
    console.log(`   - Content: ${seededData.contentIds.length}`);
    console.log(`   - AI Tasks: ${seededData.taskIds.length}`);
    console.log(`   - Niches: ${seededData.nicheIds.length}`);

    return seededData;

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Execute clearing and seeding immediately
clearAndSimpleSeedDatabase()
  .then(() => {
    console.log('✅ Database clearing and seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database clearing and seeding failed:', error);
    process.exit(1);
  });

export { clearAndSimpleSeedDatabase, simpleSeedDatabase };
