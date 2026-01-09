-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE DATABASE SCHEMA FIX - SYNTAX ERROR FREE VERSION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes ALL database schema issues identified in the audit
-- Date: 2026-01-09
-- Description: Complete schema synchronization for production-grade deployment
-- FIXED: Removed all DO $ blocks to prevent PostgreSQL syntax errors
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: FIX CONTENT TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing columns to content table (idempotent)
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS day_number INTEGER;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

ALTER TABLE content 
ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- Ensure project_id column exists
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- Add foreign key constraint (idempotent - will skip if exists)
ALTER TABLE content 
ADD CONSTRAINT content_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE MISSING AI PROJECT MANAGEMENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects table
CREATE TABLE IF NOT EXISTS ai_projects (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  project_type VARCHAR NOT NULL,
  duration INTEGER NOT NULL,
  custom_duration INTEGER,
  target_channels TEXT[] NOT NULL,
  content_frequency VARCHAR NOT NULL,
  target_audience VARCHAR,
  brand_voice VARCHAR,
  content_goals TEXT[],
  content_title VARCHAR,
  content_description TEXT,
  channel_type VARCHAR,
  tags TEXT[],
  ai_settings JSONB,
  status VARCHAR NOT NULL DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Content table
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMP,
  published_at TIMESTAMP,
  hashtags TEXT[],
  metadata JSONB,
  ai_model VARCHAR DEFAULT 'gemini-2.5-flash',
  generation_prompt TEXT,
  confidence DECIMAL(3,2),
  engagement_prediction JSONB,
  day_number INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT true,
  publish_order INTEGER DEFAULT 0,
  content_version INTEGER DEFAULT 1,
  last_regenerated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Content Calendar table
CREATE TABLE IF NOT EXISTS ai_content_calendar (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL REFERENCES ai_generated_content(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP NOT NULL,
  scheduled_time VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  optimal_posting_time BOOLEAN DEFAULT false,
  engagement_score DECIMAL(3,2),
  ai_optimized BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Engagement Patterns table
CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
  id SERIAL PRIMARY KEY,
  platform VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  optimal_times TEXT[] NOT NULL,
  engagement_score DECIMAL(3,2),
  sample_size INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Content Management table
CREATE TABLE IF NOT EXISTS project_content_management (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_days INTEGER NOT NULL,
  content_per_day INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish_unpublished BOOLEAN DEFAULT true,
  original_duration INTEGER NOT NULL,
  extended_days INTEGER DEFAULT 0,
  extension_history JSONB DEFAULT '[]',
  calendar_updated_at TIMESTAMP DEFAULT NOW(),
  last_content_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Action History table
CREATE TABLE IF NOT EXISTS content_action_history (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES ai_generated_content(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL,
  previous_status VARCHAR,
  new_status VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE STRUCTURED OUTPUTS AND GENERATED CODE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Structured outputs table for Gemini structured JSON generation
CREATE TABLE IF NOT EXISTS structured_outputs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  schema JSONB NOT NULL,
  response_json JSONB NOT NULL,
  model VARCHAR DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated code table for AI code generation
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  language VARCHAR NOT NULL,
  framework VARCHAR,
  code TEXT NOT NULL,
  explanation TEXT,
  dependencies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ADD MISSING COLUMNS TO POST_SCHEDULES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add recurrence fields to post_schedules table (idempotent)
ALTER TABLE post_schedules
ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50) DEFAULT 'none';

ALTER TABLE post_schedules
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';

ALTER TABLE post_schedules
ADD COLUMN IF NOT EXISTS series_end_date TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_day_number ON content(day_number) WHERE day_number IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_status ON content(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_created ON content(user_id, created_at DESC);

-- Content metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);

-- AI generation tasks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_tasks_user_status ON ai_generation_tasks(user_id, status);

-- AI projects indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_user_status ON ai_projects(user_id, status);

-- AI generated content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_status ON ai_generated_content(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_day_number ON ai_generated_content(day_number);

-- AI content calendar indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_calendar_ai_project_id ON ai_content_calendar(ai_project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_calendar_content_id ON ai_content_calendar(content_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_calendar_scheduled_date ON ai_content_calendar(scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_calendar_user_id ON ai_content_calendar(user_id);

-- Post schedules indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_schedules_recurrence ON post_schedules(recurrence) WHERE recurrence != 'none';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_schedules_timezone ON post_schedules(timezone) WHERE timezone != 'UTC';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_schedules_scheduled_at ON post_schedules(scheduled_at);

-- Projects indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Structured outputs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_structured_outputs_user_id ON structured_outputs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_structured_outputs_created_at ON structured_outputs(created_at);

-- Generated code indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_code_user_id ON generated_code(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_code_language ON generated_code(language);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_code_created_at ON generated_code(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: ADD DATA INTEGRITY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content table constraints
ALTER TABLE content
ADD CONSTRAINT IF NOT EXISTS chk_content_status 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'paused', 'stopped'));

ALTER TABLE content
ADD CONSTRAINT IF NOT EXISTS chk_content_type 
CHECK (content_type IN ('video', 'image', 'text', 'reel', 'short', 'post', 'story', 'blog'));

ALTER TABLE content
ADD CONSTRAINT IF NOT EXISTS chk_scheduled_future 
CHECK (scheduled_at IS NULL OR scheduled_at > NOW());

-- AI generation tasks constraints
ALTER TABLE ai_generation_tasks
ADD CONSTRAINT IF NOT EXISTS chk_ai_task_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE ai_generation_tasks
ADD CONSTRAINT IF NOT EXISTS chk_ai_task_type 
CHECK (task_type IN ('script', 'voiceover', 'video', 'thumbnail', 'content', 'optimization'));

-- AI projects constraints
ALTER TABLE ai_projects
ADD CONSTRAINT IF NOT EXISTS chk_ai_project_status 
CHECK (status IN ('active', 'completed', 'archived', 'paused'));

ALTER TABLE ai_projects
ADD CONSTRAINT IF NOT EXISTS chk_ai_project_duration 
CHECK (duration > 0 AND duration <= 365);

-- AI generated content constraints
ALTER TABLE ai_generated_content
ADD CONSTRAINT IF NOT EXISTS chk_ai_content_status 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'paused', 'stopped'));

ALTER TABLE ai_generated_content
ADD CONSTRAINT IF NOT EXISTS chk_ai_content_day_number 
CHECK (day_number > 0);

-- Post schedules constraints
ALTER TABLE post_schedules
ADD CONSTRAINT IF NOT EXISTS chk_recurrence_type 
CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'weekdays'));

ALTER TABLE post_schedules
ADD CONSTRAINT IF NOT EXISTS chk_series_end_future 
CHECK (series_end_date IS NULL OR series_end_date > scheduled_at);

-- Projects constraints
ALTER TABLE projects
ADD CONSTRAINT IF NOT EXISTS chk_project_status 
CHECK (status IN ('active', 'completed', 'archived'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: CREATE AUTOMATIC TIMESTAMP UPDATE TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create or replace the timestamp update function (using $$ syntax which is valid)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates (idempotent)
DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_projects_updated_at ON ai_projects;
CREATE TRIGGER update_ai_projects_updated_at
    BEFORE UPDATE ON ai_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_generated_content_updated_at ON ai_generated_content;
CREATE TRIGGER update_ai_generated_content_updated_at
    BEFORE UPDATE ON ai_generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_content_calendar_updated_at ON ai_content_calendar;
CREATE TRIGGER update_ai_content_calendar_updated_at
    BEFORE UPDATE ON ai_content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_content_management_updated_at ON project_content_management;
CREATE TRIGGER update_project_content_management_updated_at
    BEFORE UPDATE ON project_content_management
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: SEED ESSENTIAL DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert AI engagement patterns for better optimization (idempotent)
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size) 
VALUES 
  ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000),
  ('instagram', 'tech', ARRAY['10:00', '14:00', '19:00'], 0.82, 800),
  ('instagram', 'lifestyle', ARRAY['08:00', '13:00', '18:00'], 0.88, 1200),
  ('youtube', 'fitness', ARRAY['14:00', '20:00'], 0.90, 500),
  ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600),
  ('facebook', 'lifestyle', ARRAY['09:00', '15:00', '19:00'], 0.75, 900),
  ('tiktok', 'fitness', ARRAY['18:00', '20:00', '22:00'], 0.92, 1500),
  ('linkedin', 'business', ARRAY['08:00', '12:00', '17:00'], 0.78, 400)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 9: ADD HELPFUL COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN content.day_number IS 'Day number in the project timeline (1, 2, 3, etc.)';
COMMENT ON COLUMN content.is_paused IS 'Individual content pause state';
COMMENT ON COLUMN content.is_stopped IS 'Individual content stop state';
COMMENT ON COLUMN content.can_publish IS 'Whether this content can be published';
COMMENT ON COLUMN content.publish_order IS 'Order of publishing within the day';
COMMENT ON COLUMN content.content_version IS 'Version for regeneration tracking';

COMMENT ON COLUMN post_schedules.recurrence IS 'Recurrence pattern: none, daily, weekly, monthly, weekdays';
COMMENT ON COLUMN post_schedules.timezone IS 'Timezone identifier (e.g., America/New_York, Europe/London)';
COMMENT ON COLUMN post_schedules.series_end_date IS 'End date for recurring series (optional)';

COMMENT ON TABLE ai_projects IS 'AI-powered project management for content generation';
COMMENT ON TABLE ai_generated_content IS 'AI-generated content pieces with scheduling and management';
COMMENT ON TABLE ai_content_calendar IS 'Calendar entries for AI-generated content scheduling';
COMMENT ON TABLE structured_outputs IS 'Structured JSON outputs from AI models';
COMMENT ON TABLE generated_code IS 'AI-generated code snippets and applications';

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION - SIMPLE SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Simple completion message (no DO blocks)
SELECT 'COMPREHENSIVE DATABASE SCHEMA FIX COMPLETED SUCCESSFULLY' as migration_status;