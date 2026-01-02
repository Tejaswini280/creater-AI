import { db } from './db';
import { 
  users, 
  content, 
  templates, 
  notifications, 
  aiGenerationTasks, 
  contentMetrics, 
  niches,
  socialAccounts 
} from '../shared/schema';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients with provided API keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SeededData {
  userIds: string[];
  contentIds: number[];
  templateIds: number[];
  notificationIds: number[];
  taskIds: number[];
  nicheIds: number[];
  socialAccountIds: number[];
}

// AI Content Generation Functions
async function generateAIContent(prompt: string, type: 'script' | 'description' | 'title' | 'tags'): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content creator. Generate ${type} content that is engaging, professional, and optimized for social media platforms.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: type === 'script' ? 500 : 100,
      temperature: 0.7
    });
    
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    return faker.lorem.paragraph();
  }
}

async function generateGeminiContent(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating Gemini content:', error);
    return faker.lorem.paragraph();
  }
}

async function seedDatabase(): Promise<SeededData> {
  console.log('🌱 Starting Phase 4 Real Data Seeding...');
  
  const seededData: SeededData = {
    userIds: [],
    contentIds: [],
    templateIds: [],
    notificationIds: [],
    taskIds: [],
    nicheIds: [],
    socialAccountIds: []
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

    // 2. Seed Niches (20+ trending niches)
    console.log('🎯 Seeding niches...');
    const nicheData = [
      { name: 'Tech Reviews', category: 'Technology', difficulty: 'medium', profitability: 'high' },
      { name: 'Fitness & Health', category: 'Lifestyle', difficulty: 'easy', profitability: 'medium' },
      { name: 'Cooking & Recipes', category: 'Food', difficulty: 'easy', profitability: 'high' },
      { name: 'Travel Vlogs', category: 'Travel', difficulty: 'medium', profitability: 'medium' },
      { name: 'Business Tips', category: 'Business', difficulty: 'hard', profitability: 'high' },
      { name: 'Gaming Content', category: 'Entertainment', difficulty: 'easy', profitability: 'medium' },
      { name: 'Educational Content', category: 'Education', difficulty: 'medium', profitability: 'medium' },
      { name: 'Fashion & Style', category: 'Lifestyle', difficulty: 'medium', profitability: 'high' },
      { name: 'DIY & Crafts', category: 'Creative', difficulty: 'easy', profitability: 'medium' },
      { name: 'Pet Care', category: 'Lifestyle', difficulty: 'easy', profitability: 'medium' },
      { name: 'Finance & Investing', category: 'Business', difficulty: 'hard', profitability: 'high' },
      { name: 'Parenting Tips', category: 'Family', difficulty: 'medium', profitability: 'medium' },
      { name: 'Car Reviews', category: 'Automotive', difficulty: 'medium', profitability: 'high' },
      { name: 'Book Reviews', category: 'Entertainment', difficulty: 'easy', profitability: 'low' },
      { name: 'Music Production', category: 'Creative', difficulty: 'hard', profitability: 'medium' },
      { name: 'Photography Tips', category: 'Creative', difficulty: 'medium', profitability: 'medium' },
      { name: 'Language Learning', category: 'Education', difficulty: 'medium', profitability: 'medium' },
      { name: 'Home Improvement', category: 'Lifestyle', difficulty: 'medium', profitability: 'high' },
      { name: 'Skincare & Beauty', category: 'Lifestyle', difficulty: 'easy', profitability: 'high' },
      { name: 'Mental Health', category: 'Health', difficulty: 'hard', profitability: 'medium' }
    ];

    const insertedNiches = await db.insert(niches).values(nicheData).returning();
    seededData.nicheIds = insertedNiches.map(n => n.id);
    console.log(`✅ Seeded ${insertedNiches.length} niches`);

    // 3. Seed Templates (50+ AI-generated templates)
    console.log('📝 Seeding AI-generated templates...');
    const templateCategories = ['video', 'thumbnail', 'script', 'branding', 'social'];
    const templateTypes = ['Script Template', 'Video Template', 'Thumbnail Template', 'Branding Kit', 'Social Media Template'];
    
    const templatePromises = Array.from({ length: 50 }, async () => {
      const category = faker.helpers.arrayElement(templateCategories);
      const type = faker.helpers.arrayElement(templateTypes);
      
      // Generate AI content for template
      const title = await generateAIContent(`Generate a compelling title for a ${category} template`, 'title');
      const description = await generateAIContent(`Write a description for a ${category} template`, 'description');
      const content = await generateAIContent(`Create a ${category} template content`, 'script');
      
      return {
        title: title || faker.commerce.productName(),
        description: description || faker.lorem.paragraph(),
        category,
        type,
        content: content || faker.lorem.paragraphs(3),
        thumbnailUrl: faker.image.url(),
        rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }).toString(),
        downloads: faker.number.int({ min: 0, max: 10000 }),
        isActive: faker.datatype.boolean(0.95),
        isFeatured: faker.datatype.boolean(0.2),
        tags: faker.helpers.arrayElements(['productivity', 'tech', 'fitness', 'cooking', 'travel', 'business', 'education', 'entertainment'], { min: 2, max: 5 }),
        metadata: {
          difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
          duration: faker.number.int({ min: 5, max: 60 }),
          platform: faker.helpers.arrayElement(['youtube', 'instagram', 'tiktok', 'linkedin'])
        }
      };
    });

    const templateData = await Promise.all(templatePromises);
    const insertedTemplates = await db.insert(templates).values(templateData).returning();
    seededData.templateIds = insertedTemplates.map(t => t.id);
    console.log(`✅ Seeded ${insertedTemplates.length} AI-generated templates`);

    // 4. Seed Content (50+ AI-generated content pieces)
    console.log('📹 Seeding AI-generated content...');
    const platforms = ['youtube', 'instagram', 'facebook', 'tiktok', 'linkedin'];
    const contentTypes = ['video', 'image', 'text', 'reel', 'short'];
    const statuses = ['draft', 'scheduled', 'published', 'failed'];
    
    const contentPromises = Array.from({ length: 50 }, async () => {
      const platform = faker.helpers.arrayElement(platforms);
      const contentType = faker.helpers.arrayElement(contentTypes);
      const status = faker.helpers.arrayElement(statuses);
      const userId = faker.helpers.arrayElement(seededData.userIds);
      
      // Generate AI content
      const title = await generateAIContent(`Generate a title for ${contentType} content on ${platform}`, 'title');
      const description = await generateAIContent(`Write a description for ${contentType} content on ${platform}`, 'description');
      const script = contentType === 'video' ? await generateAIContent(`Write a script for a ${contentType} on ${platform}`, 'script') : null;
      const tags = await generateAIContent(`Generate tags for ${contentType} content on ${platform}`, 'tags');
      
      return {
        userId,
        title: title || faker.lorem.sentence(),
        description: description || faker.lorem.paragraph(),
        script: script || null,
        platform,
        contentType,
        status,
        scheduledAt: status === 'scheduled' ? faker.date.future() : null,
        publishedAt: status === 'published' ? faker.date.past() : null,
        thumbnailUrl: faker.image.url(),
        videoUrl: contentType === 'video' ? faker.internet.url() : null,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : faker.helpers.arrayElements(['tech', 'lifestyle', 'business', 'entertainment'], { min: 2, max: 5 }),
        metadata: {
          duration: contentType === 'video' ? faker.number.int({ min: 30, max: 1800 }) : null,
          views: status === 'published' ? faker.number.int({ min: 100, max: 100000 }) : 0,
          likes: status === 'published' ? faker.number.int({ min: 10, max: 10000 }) : 0,
          comments: status === 'published' ? faker.number.int({ min: 0, max: 1000 }) : 0
        },
        aiGenerated: true
      };
    });

    const contentData = await Promise.all(contentPromises);
    const insertedContent = await db.insert(content).values(contentData).returning();
    seededData.contentIds = insertedContent.map(c => c.id);
    console.log(`✅ Seeded ${insertedContent.length} AI-generated content pieces`);

    // 5. Seed Content Metrics (realistic metrics for published content)
    console.log('📊 Seeding content metrics...');
    const metricsData = insertedContent
      .filter(c => c.status === 'published')
      .map(content => ({
        contentId: content.id,
        platform: content.platform,
        views: faker.number.int({ min: 100, max: 100000 }),
        likes: faker.number.int({ min: 10, max: 10000 }),
        comments: faker.number.int({ min: 0, max: 1000 }),
        shares: faker.number.int({ min: 0, max: 500 }),
        engagementRate: faker.number.float({ min: 0.01, max: 0.15, fractionDigits: 4 }).toString(),
        revenue: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }).toString()
      }));

    await db.insert(contentMetrics).values(metricsData);
    console.log(`✅ Seeded ${metricsData.length} content metrics`);

    // 6. Seed AI Generation Tasks (50+ AI tasks)
    console.log('🤖 Seeding AI generation tasks...');
    const taskTypes = ['script', 'voiceover', 'video', 'thumbnail'];
    const taskStatuses = ['pending', 'processing', 'completed', 'failed'];
    
    const taskPromises = Array.from({ length: 50 }, async () => {
      const taskType = faker.helpers.arrayElement(taskTypes);
      const status = faker.helpers.arrayElement(taskStatuses);
      const userId = faker.helpers.arrayElement(seededData.userIds);
      
      const prompt = await generateAIContent(`Generate a prompt for ${taskType} generation`, 'description');
      const result = status === 'completed' ? await generateAIContent(`Generate ${taskType} content`, taskType as any) : null;
      
      return {
        userId,
        taskType,
        prompt: prompt || faker.lorem.sentence(),
        result,
        status,
        metadata: {
          model: faker.helpers.arrayElement(['gpt-4o', 'gemini-2.0-flash-exp', 'dall-e-3']),
          duration: status === 'completed' ? faker.number.int({ min: 5, max: 120 }) : null,
          tokens: status === 'completed' ? faker.number.int({ min: 100, max: 2000 }) : null
        },
        completedAt: status === 'completed' ? faker.date.past() : null
      };
    });

    const taskData = await Promise.all(taskPromises);
    const insertedTasks = await db.insert(aiGenerationTasks).values(taskData).returning();
    seededData.taskIds = insertedTasks.map(t => t.id);
    console.log(`✅ Seeded ${insertedTasks.length} AI generation tasks`);

    // 7. Seed Social Accounts (realistic social media accounts)
    console.log('📱 Seeding social accounts...');
    const socialPlatforms = ['youtube', 'instagram', 'facebook', 'tiktok', 'linkedin'];
    
    const socialAccountData = seededData.userIds.flatMap(userId => 
      faker.helpers.arrayElements(socialPlatforms, { min: 1, max: 3 }).map(platform => ({
        userId,
        platform,
        accountId: faker.string.alphanumeric(10),
        accountName: faker.internet.userName(),
        accessToken: faker.string.alphanumeric(50),
        refreshToken: faker.string.alphanumeric(50),
        tokenExpiry: faker.date.future(),
        isActive: faker.datatype.boolean(0.8),
        metadata: {
          followers: faker.number.int({ min: 100, max: 100000 }),
          following: faker.number.int({ min: 50, max: 5000 }),
          posts: faker.number.int({ min: 10, max: 1000 }),
          verified: faker.datatype.boolean(0.1)
        }
      }))
    );

    const insertedSocialAccounts = await db.insert(socialAccounts).values(socialAccountData).returning();
    seededData.socialAccountIds = insertedSocialAccounts.map(sa => sa.id);
    console.log(`✅ Seeded ${insertedSocialAccounts.length} social accounts`);

    // 8. Seed Notifications (50+ realistic notifications)
    console.log('🔔 Seeding notifications...');
    const notificationTypes = ['info', 'success', 'warning', 'error'];
    
    const notificationData = seededData.userIds.flatMap(userId => 
      Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
        const type = faker.helpers.arrayElement(notificationTypes);
        const isRead = faker.datatype.boolean(0.7);
        
        return {
          userId,
          type,
          title: faker.lorem.sentence(),
          message: faker.lorem.paragraph(),
          isRead,
          actionUrl: faker.datatype.boolean(0.3) ? faker.internet.url() : null,
          metadata: {
            priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
            category: faker.helpers.arrayElement(['content', 'system', 'social', 'ai'])
          }
        };
      })
    );

    const insertedNotifications = await db.insert(notifications).values(notificationData).returning();
    seededData.notificationIds = insertedNotifications.map(n => n.id);
    console.log(`✅ Seeded ${insertedNotifications.length} notifications`);

    console.log('🎉 Phase 4 Real Data Seeding Completed Successfully!');
    console.log('📊 Seeding Summary:');
    console.log(`   👥 Users: ${seededData.userIds.length}`);
    console.log(`   🎯 Niches: ${seededData.nicheIds.length}`);
    console.log(`   📝 Templates: ${seededData.templateIds.length}`);
    console.log(`   📹 Content: ${seededData.contentIds.length}`);
    console.log(`   🤖 AI Tasks: ${seededData.taskIds.length}`);
    console.log(`   📱 Social Accounts: ${seededData.socialAccountIds.length}`);
    console.log(`   🔔 Notifications: ${seededData.notificationIds.length}`);

    return seededData;

  } catch (error) {
    console.error('❌ Error during Phase 4 seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url.endsWith('phase4-real-data-seeding.ts') || process.argv[1]?.includes('phase4-real-data-seeding.ts')) {
  seedDatabase()
    .then(() => {
      console.log('✅ Phase 4 seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Phase 4 seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
