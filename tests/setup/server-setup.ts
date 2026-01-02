import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { db } from '../../server/db';
import { users, content, projects, socialPosts, aiGenerationTasks, notifications } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Test database setup
beforeAll(async () => {
  // Ensure database connection
  try {
    await db.execute('SELECT 1');
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  try {
    await db.$client.end();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Error closing test database:', error);
  }
});

// Clean up test data between tests
beforeEach(async () => {
  try {
    // Clean up in reverse order of dependencies
    await db.delete(notifications).where(eq(notifications.userId, 'test-user'));
    await db.delete(aiGenerationTasks).where(eq(aiGenerationTasks.userId, 'test-user'));
    await db.delete(socialPosts).where(eq(socialPosts.userId, 'test-user'));
    await db.delete(content).where(eq(content.userId, 'test-user'));
    await db.delete(projects).where(eq(projects.userId, 'test-user'));
    await db.delete(users).where(eq(users.email, 'test@example.com'));

    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
});

afterEach(async () => {
  // Additional cleanup if needed
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global test utilities
global.testUser = {
  id: 'test-user',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'TestPassword123!'
};

global.createTestUser = async () => {
  const [user] = await db.insert(users).values({
    id: global.testUser.id,
    email: global.testUser.email,
    password: global.testUser.password,
    firstName: global.testUser.firstName,
    lastName: global.testUser.lastName
  }).returning();

  return user;
};

global.createTestProject = async (userId: string) => {
  const [project] = await db.insert(projects).values({
    userId,
    name: 'Test Project',
    description: 'Test project description',
    type: 'video',
    platform: 'youtube',
    status: 'active'
  }).returning();

  return project;
};

global.createTestContent = async (userId: string, projectId?: number) => {
  const [contentItem] = await db.insert(content).values({
    userId,
    projectId,
    title: 'Test Content',
    description: 'Test content description',
    platform: 'youtube',
    contentType: 'video',
    status: 'draft'
  }).returning();

  return contentItem;
};

// Mock external services
jest.mock('../../server/services/youtube', () => ({
  YouTubeService: jest.fn().mockImplementation(() => ({
    uploadVideo: jest.fn().mockResolvedValue({ videoId: 'test-video-id' }),
    getChannelInfo: jest.fn().mockResolvedValue({ title: 'Test Channel' })
  }))
}));

jest.mock('../../server/services/openai', () => ({
  OpenAIService: jest.fn().mockImplementation(() => ({
    generateScript: jest.fn().mockResolvedValue('Generated test script'),
    generateThumbnail: jest.fn().mockResolvedValue('https://example.com/thumbnail.jpg')
  }))
}));

// Custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
    }
  }

  var testUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };

  var createTestUser: () => Promise<any>;
  var createTestProject: (userId: string) => Promise<any>;
  var createTestContent: (userId: string, projectId?: number) => Promise<any>;
}
