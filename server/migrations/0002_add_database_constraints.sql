-- Migration: Add database constraints for data integrity
-- Date: 2024-12-19
-- Description: Adds check constraints, indexes, and data integrity rules

-- Content table constraints
ALTER TABLE content
ADD CONSTRAINT chk_content_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

ALTER TABLE content
ADD CONSTRAINT chk_content_type CHECK (content_type IN ('video', 'image', 'text', 'reel', 'short'));

ALTER TABLE content
ADD CONSTRAINT chk_scheduled_future CHECK (scheduled_at IS NULL OR scheduled_at > NOW());

-- AI Generation Tasks constraints
ALTER TABLE ai_generation_tasks
ADD CONSTRAINT chk_ai_task_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE ai_generation_tasks
ADD CONSTRAINT chk_ai_task_type CHECK (task_type IN ('script', 'voiceover', 'video', 'thumbnail'));

-- Social Posts constraints
ALTER TABLE social_posts
ADD CONSTRAINT chk_social_post_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

ALTER TABLE social_posts
ADD CONSTRAINT chk_social_post_type CHECK (content_type IN ('post', 'reel', 'short', 'story', 'video'));

ALTER TABLE social_posts
ADD CONSTRAINT chk_scheduled_future_social CHECK (scheduled_at IS NULL OR scheduled_at > NOW());

-- Platform Posts constraints
ALTER TABLE platform_posts
ADD CONSTRAINT chk_platform_post_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

-- Post Schedules constraints
ALTER TABLE post_schedules
ADD CONSTRAINT chk_post_schedule_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE post_schedules
ADD CONSTRAINT chk_recurrence_type CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'weekdays'));

ALTER TABLE post_schedules
ADD CONSTRAINT chk_timezone_format CHECK (timezone IS NULL OR LENGTH(timezone) >= 3);

ALTER TABLE post_schedules
ADD CONSTRAINT chk_series_end_future CHECK (series_end_date IS NULL OR series_end_date > scheduled_at);

-- Projects constraints
ALTER TABLE projects
ADD CONSTRAINT chk_project_status CHECK (status IN ('active', 'completed', 'archived'));

ALTER TABLE projects
ADD CONSTRAINT chk_project_type CHECK (type IN ('video', 'audio', 'image', 'script', 'campaign'));

-- Users constraints (if not already present)
ALTER TABLE users
ADD CONSTRAINT chk_user_active CHECK (is_active IN (true, false));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_platform_posts_status ON platform_posts(status);
CREATE INDEX IF NOT EXISTS idx_post_schedules_status ON post_schedules(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_user_status ON content(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status ON social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_status ON ai_generation_tasks(user_id, status);

-- Additional performance indexes for V1 optimization
CREATE INDEX IF NOT EXISTS idx_content_user_created ON content(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_posts_social_post ON platform_posts(social_post_id);
CREATE INDEX IF NOT EXISTS idx_post_schedules_scheduled_at ON post_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_metrics_content ON content_metrics(content_id, created_at DESC);

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_platform ON hashtag_suggestions(platform);

-- Comments for documentation
COMMENT ON CONSTRAINT chk_content_status ON content IS 'Ensures content status is valid';
COMMENT ON CONSTRAINT chk_scheduled_future ON content IS 'Ensures scheduled time is in the future';
COMMENT ON CONSTRAINT chk_recurrence_type ON post_schedules IS 'Ensures recurrence pattern is valid';
COMMENT ON CONSTRAINT chk_series_end_future ON post_schedules IS 'Ensures series end date is after scheduled date';
