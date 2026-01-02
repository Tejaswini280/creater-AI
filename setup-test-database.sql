
-- Database setup script for test data
-- Run this in your database to create test projects and content

-- Insert test projects
INSERT INTO projects (id, user_id, name, description, type, tags, status, created_at, updated_at) VALUES
(1, 'test-user-id', 'Project 1', 'First content', 'video', ARRAY['video', 'content'], 'active', NOW(), NOW()),
(2, 'test-user-id', 'Project 2', 'Second project', 'campaign', ARRAY['campaign', 'marketing'], 'active', NOW(), NOW());

-- Insert test content
INSERT INTO content (id, user_id, project_id, title, description, platform, content_type, status, created_at, updated_at) VALUES
(1, 'test-user-id', 1, 'Sample Video Content', 'This is a test video content for Project 1', 'youtube', 'video', 'draft', NOW(), NOW()),
(2, 'test-user-id', 1, 'Instagram Post', 'Test Instagram post for Project 1', 'instagram', 'post', 'published', NOW(), NOW()),
(3, 'test-user-id', 2, 'Facebook Campaign', 'Marketing campaign for Project 2', 'facebook', 'campaign', 'scheduled', NOW(), NOW());
  