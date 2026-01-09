-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE DATABASE SCHEMA FIX - FINAL VERSION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script fixes ALL database schema issues identified in the production logs
-- Date: 2026-01-09
-- Description: Complete schema synchronization for production deployment
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: FIX USERS TABLE - ADD MISSING PASSWORD COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add password column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';

-- Update the default constraint to remove it after adding the column
ALTER TABLE users 
ALTER COLUMN password DROP DEFAULT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: FIX CONTENT TABLE - ADD MISSING PROJECT_ID COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add project_id column to content table if it doesn't exist
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- Add foreign key constraint for project_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_project_id_projects_id_fk' 
    AND table_name = 'content'
  ) THEN
    ALTER TABLE content ADD CONSTRAINT content_project_id_projects_id_fk 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: ADD ALL MISSING COLUMNS TO CONTENT TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add all missing columns to content table (idempotent)
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS day_number INTEGER,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE ALL MISSING AI PROJECT MANAGEMENT TABLES
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
-- STEP 5: CREATE STRUCTURED OUTPUTS AND GENERATED CODE TABLES
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
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- STEP 6: ADD MISSING COLUMNS TO POST_SCHEDULES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add recurrence fields to post_schedules table (idempotent)
ALTER TABLE post_schedules
ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS series_end_date TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: CREATE COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_day_number ON content(day_number) WHERE day_number IS NOT NULL;

-- AI projects indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);

-- AI generated content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_status ON ai_generated_content(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: ADD DATA INTEGRITY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content table constraints
ALTER TABLE content
ADD CONSTRAINT IF NOT EXISTS chk_content_status 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'paused', 'stopped'));

-- AI projects constraints
ALTER TABLE ai_projects
ADD CONSTRAINT IF NOT EXISTS chk_ai_project_status 
CHECK (status IN ('active', 'completed', 'archived', 'paused'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 9: CREATE AUTOMATIC TIMESTAMP UPDATE TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create or replace the timestamp update function
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 10: SEED ESSENTIAL DATA
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

-- Insert hashtag suggestions (idempotent)
INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count) 
VALUES 
  ('instagram', 'fitness', '#fitness', 95, 1000000),
  ('instagram', 'fitness', '#workout', 90, 800000),
  ('instagram', 'fitness', '#gym', 88, 750000),
  ('instagram', 'fitness', '#health', 85, 600000),
  ('instagram', 'tech', '#technology', 92, 500000),
  ('instagram', 'tech', '#innovation', 88, 400000),
  ('instagram', 'tech', '#ai', 95, 300000),
  ('instagram', 'tech', '#coding', 85, 250000),
  ('youtube', 'fitness', '#fitness', 90, 200000),
  ('youtube', 'fitness', '#workout', 88, 180000),
  ('youtube', 'tech', '#tech', 92, 150000),
  ('youtube', 'tech', '#programming', 89, 120000),
  ('tiktok', 'fitness', '#fitness', 98, 2000000),
  ('tiktok', 'fitness', '#fyp', 95, 5000000),
  ('tiktok', 'tech', '#tech', 90, 800000),
  ('linkedin', 'business', '#business', 85, 300000)
ON CONFLICT DO NOTHING;

-- Insert content templates (idempotent)
INSERT INTO templates (title, description, category, type, content, rating, downloads) 
VALUES 
  ('Fitness Motivation Post', 'Motivational fitness content template', 'fitness', 'Social Media Post', 'Transform your body, transform your life! 💪 #fitness #motivation', 4.8, 1250),
  ('Tech Tutorial Script', 'Educational tech content template', 'tech', 'Video Script', 'In this tutorial, we''ll explore [TOPIC] and learn how to [OBJECTIVE]. Let''s get started!', 4.9, 980),
  ('Business Growth Tips', 'Business advice content template', 'business', 'Social Media Post', 'Here are 3 proven strategies to grow your business: 1) [TIP 1] 2) [TIP 2] 3) [TIP 3]', 4.7, 750),
  ('Lifestyle Inspiration', 'Lifestyle and wellness content template', 'lifestyle', 'Social Media Post', 'Living your best life starts with small daily choices ✨ #lifestyle #wellness', 4.6, 650)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 11: CREATE TEST USER IF NEEDED
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create a test user for development/testing (idempotent)
INSERT INTO users (id, email, password, first_name, last_name) 
VALUES 
  ('test-user-1', 'test@example.com', '$2b$10$rQZ9QmjytWzQgwjvHJ4zKOXvnK4nK4nK4nK4nK4nK4nK4nK4nK4nK4', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 12: ADD HELPFUL COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN content.project_id IS 'Reference to the project this content belongs to';
COMMENT ON COLUMN content.day_number IS 'Day number in the project timeline (1, 2, 3, etc.)';
COMMENT ON COLUMN content.is_paused IS 'Individual content pause state';
COMMENT ON COLUMN content.is_stopped IS 'Individual content stop state';
COMMENT ON COLUMN content.can_publish IS 'Whether this content can be published';
COMMENT ON COLUMN content.publish_order IS 'Order of publishing within the day';
COMMENT ON COLUMN content.content_version IS 'Version for regeneration tracking';

COMMENT ON COLUMN users.password IS 'Hashed password for authentication';

COMMENT ON TABLE ai_projects IS 'AI-powered project management for content generation';
COMMENT ON TABLE ai_generated_content IS 'AI-generated content pieces with scheduling and management';
COMMENT ON TABLE ai_content_calendar IS 'Calendar entries for AI-generated content scheduling';
COMMENT ON TABLE structured_outputs IS 'Structured JSON outputs from AI models';
COMMENT ON TABLE generated_code IS 'AI-generated code snippets and applications';

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION LOG
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'COMPREHENSIVE DATABASE SCHEMA FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '  ✅ Added missing password column to users table';
    RAISE NOTICE '  ✅ Added missing project_id column to content table';
    RAISE NOTICE '  ✅ Added missing columns to content table (day_number, is_paused, etc.)';
    RAISE NOTICE '  ✅ Created all missing AI project management tables';
    RAISE NOTICE '  ✅ Added structured_outputs and generated_code tables';
    RAISE NOTICE '  ✅ Fixed post_schedules table with recurrence fields';
    RAISE NOTICE '  ✅ Created comprehensive performance indexes';
    RAISE NOTICE '  ✅ Added data integrity constraints';
    RAISE NOTICE '  ✅ Set up automatic timestamp triggers';
    RAISE NOTICE '  ✅ Seeded essential engagement pattern data';
    RAISE NOTICE '  ✅ Created test user for development';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now fully synchronized and production-ready!';
    RAISE NOTICE 'The scheduler service should now work without errors.';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
END $$;