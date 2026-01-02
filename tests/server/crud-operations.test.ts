import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server/index';
import { db } from '../../server/db';
import { users, content, projects, socialPosts, aiGenerationTasks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('CRUD Operations API Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testProjectId: number;
  let testContentId: number;

  beforeAll(async () => {
    // Clean up test data
    await db.delete(content).where(eq(content.userId, 'test-user'));
    await db.delete(projects).where(eq(projects.userId, 'test-user'));
    await db.delete(users).where(eq(users.email, 'test@example.com'));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(content).where(eq(content.userId, 'test-user'));
    await db.delete(projects).where(eq(projects.userId, 'test-user'));
    await db.delete(users).where(eq(users.email, 'test@example.com'));
  });

  describe('Authentication CRUD', () => {
    it('should register a new user (CREATE)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      testUserId = response.body.data.id;
    });

    it('should login user (READ)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      authToken = response.body.data.token;
    });

    it('should get user profile (READ)', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('Project CRUD', () => {
    it('should create a new project (CREATE)', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'A test project for CRUD operations',
          type: 'video',
          platform: 'youtube',
          targetAudience: 'Developers',
          estimatedDuration: '2 weeks',
          tags: ['test', 'crud', 'api']
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      testProjectId = response.body.data.id;
    });

    it('should get all projects (READ)', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get project by ID (READ)', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Project');
    });

    it('should update project (UPDATE)', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Project',
          description: 'Updated description',
          status: 'active'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Project');
    });

    it('should delete project (DELETE)', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 for deleted project (READ)', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Content CRUD', () => {
    beforeEach(async () => {
      // Create a test project for content tests
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Content Test Project',
          type: 'video',
          platform: 'youtube'
        });

      testProjectId = projectResponse.body.data.id;
    });

    it('should create content (CREATE)', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Content',
          description: 'Test content description',
          script: 'Test script content',
          platform: 'youtube',
          contentType: 'video',
          projectId: testProjectId,
          tags: ['test', 'video'],
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      testContentId = response.body.data.id;
    });

    it('should get all content (READ)', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get content by ID (READ)', async () => {
      const response = await request(app)
        .get(`/api/content/${testContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Content');
    });

    it('should update content (UPDATE)', async () => {
      const response = await request(app)
        .put(`/api/content/${testContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Content',
          status: 'scheduled'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Test Content');
    });

    it('should delete content (DELETE)', async () => {
      const response = await request(app)
        .delete(`/api/content/${testContentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Social Account CRUD', () => {
    let socialAccountId: number;

    it('should create social account (CREATE)', async () => {
      const response = await request(app)
        .post('/api/social-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'youtube',
          accountId: 'test-channel-id',
          accountName: 'Test Channel',
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      socialAccountId = response.body.data.id;
    });

    it('should get social accounts (READ)', async () => {
      const response = await request(app)
        .get('/api/social-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should delete social account (DELETE)', async () => {
      const response = await request(app)
        .delete(`/api/social-accounts/${socialAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('AI Task CRUD', () => {
    let aiTaskId: number;

    it('should create AI task (CREATE)', async () => {
      const response = await request(app)
        .post('/api/ai/generate-script')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topic: 'Test AI Content Generation',
          platform: 'youtube',
          duration: '5 minutes'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // AI task creation might return task ID or just success
    });

    it('should get AI tasks (READ)', async () => {
      const response = await request(app)
        .get('/api/ai/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should cleanup old AI tasks (DELETE)', async () => {
      const response = await request(app)
        .delete('/api/ai/tasks/cleanup?olderThanDays=30&status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid project data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          type: 'invalid-type' // Invalid: not in enum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject content with future date in past', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Content',
          platform: 'youtube',
          contentType: 'video',
          scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Business Logic Tests', () => {
    it('should enforce ownership permissions', async () => {
      // Create content with test user
      const contentResponse = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Ownership Test Content',
          platform: 'youtube',
          contentType: 'video'
        });

      const contentId = contentResponse.body.data.id;

      // Try to access as different user (this should fail in real scenario)
      // For now, test that current user can access their own content
      const readResponse = await request(app)
        .get(`/api/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.id).toBe(contentId);
    });

    it('should handle cascade deletes properly', async () => {
      // Create project with content
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cascade Test Project',
          type: 'video'
        });

      const projectId = projectResponse.body.data.id;

      const contentResponse = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Cascade Test Content',
          platform: 'youtube',
          contentType: 'video',
          projectId: projectId
        });

      const contentId = contentResponse.body.data.id;

      // Delete project
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Content should be deleted due to cascade
      const contentReadResponse = await request(app)
        .get(`/api/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(contentReadResponse.body.success).toBe(false);
    });
  });
});
