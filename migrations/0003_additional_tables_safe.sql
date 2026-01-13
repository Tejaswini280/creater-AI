-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL TABLES - PRODUCTION SAFE VERSION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Creates additional tables for AI features and advanced functionality
-- Safe on fresh DB and partially migrated DB
-- NO FOREIGN KEYS for maximum safety
-- Date: 2026-01-10
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE AI PROJECT MANAGEMENT TABLES (NO FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS ai_projects (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
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

-- AI Generated Content table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
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

-- AI Content Calendar table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS ai_content_calendar (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
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

-- Project Content Management table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS project_content_management (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
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

-- Content Action History table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS content_action_history (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  previous_status VARCHAR,
  new_status VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE STRUCTURED OUTPUTS AND GENERATED CODE TABLES (NO FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Structured outputs table for Gemini structured JSON generation (NO FOREIGN KEY)
CREATE TABLE IF NOT EXISTS structured_outputs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  prompt TEXT NOT NULL,
  schema JSONB NOT NULL,
  response_json JSONB NOT NULL,
  model VARCHAR DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated code table for AI code generation (NO FOREIGN KEY)
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  description TEXT NOT NULL,
  language VARCHAR NOT NULL,
  framework VARCHAR,
  code TEXT NOT NULL,
  explanation TEXT,
  dependencies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE MEDIA AND PLATFORM TABLES (NO FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Platform Posts table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS platform_posts (
    id SERIAL PRIMARY KEY NOT NULL,
    social_post_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    account_id VARCHAR NOT NULL,
    caption TEXT,
    hashtags TEXT[],
    emojis TEXT[],
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    status VARCHAR DEFAULT 'draft' NOT NULL,
    platform_post_id VARCHAR,
    platform_url VARCHAR,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post Media table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY NOT NULL,
    social_post_id INTEGER NOT NULL,
    media_type VARCHAR NOT NULL,
    media_url VARCHAR NOT NULL,
    thumbnail_url VARCHAR,
    file_name VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    duration INTEGER,
    dimensions JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ADD MISSING COLUMNS TO EXISTING TABLES (CRITICAL FIXES)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing project wizard fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_type TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS channel_types TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_frequency VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_formats TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_themes TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_voice VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_length VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS posting_frequency VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_tools TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scheduling_preferences JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_members TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals TEXT[];

-- Add enhanced content management columns to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS engagement_prediction JSONB;
ALTER TABLE content ADD COLUMN IF NOT EXISTS target_audience VARCHAR(100);
ALTER TABLE content ADD COLUMN IF NOT EXISTS optimal_posting_time TIMESTAMP;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_metadata JSONB;
ALTER TABLE content ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true;
ALTER TABLE content ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI projects indexes
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_status ON ai_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_projects_project_type ON ai_projects(project_type);

-- AI generated content indexes
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_status ON ai_generated_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_day_number ON ai_generated_content(day_number);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_platform ON ai_generated_content(platform);

-- AI content calendar indexes
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_ai_project_id ON ai_content_calendar(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_content_id ON ai_content_calendar(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_scheduled_date ON ai_content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_user_id ON ai_content_calendar(user_id);

-- Project content management indexes
CREATE INDEX IF NOT EXISTS idx_project_content_management_ai_project_id ON project_content_management(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_project_content_management_user_id ON project_content_management(user_id);

-- Content action history indexes
CREATE INDEX IF NOT EXISTS idx_content_action_history_content_id ON content_action_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_action_history_user_id ON content_action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_action_history_action ON content_action_history(action);

-- Structured outputs indexes
CREATE INDEX IF NOT EXISTS idx_structured_outputs_user_id ON structured_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_outputs_created_at ON structured_outputs(created_at);

-- Generated code indexes
CREATE INDEX IF NOT EXISTS idx_generated_code_user_id ON generated_code(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_language ON generated_code(language);
CREATE INDEX IF NOT EXISTS idx_generated_code_created_at ON generated_code(created_at);

-- Platform posts indexes
CREATE INDEX IF NOT EXISTS idx_platform_posts_social_post_id ON platform_posts(social_post_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_platform ON platform_posts(platform);
CREATE INDEX IF NOT EXISTS idx_platform_posts_status ON platform_posts(status);

-- Post media indexes
CREATE INDEX IF NOT EXISTS idx_post_media_social_post_id ON post_media(social_post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_media_type ON post_media(media_type);

-- Enhanced content indexes
CREATE INDEX IF NOT EXISTS idx_content_content_status ON content(content_status) WHERE content_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_is_ai_generated ON content(is_ai_generated) WHERE is_ai_generated = true;
CREATE INDEX IF NOT EXISTS idx_content_scheduled_time ON content(scheduled_time) WHERE scheduled_time IS NOT NULL;

-- Enhanced project indexes
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_duration ON projects(duration) WHERE duration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_content_frequency ON projects(content_frequency) WHERE content_frequency IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE AUTOMATIC TIMESTAMP UPDATE TRIGGERS FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create triggers for AI tables
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

DROP TRIGGER IF EXISTS update_platform_posts_updated_at ON platform_posts;
CREATE TRIGGER update_platform_posts_updated_at
    BEFORE UPDATE ON platform_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: ADD HELPFUL COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE ai_projects IS 'AI-powered project management for content generation';
COMMENT ON TABLE ai_generated_content IS 'AI-generated content pieces with scheduling and management';
COMMENT ON TABLE ai_content_calendar IS 'Calendar entries for AI-generated content scheduling';
COMMENT ON TABLE structured_outputs IS 'Structured JSON outputs from AI models';
COMMENT ON TABLE generated_code IS 'AI-generated code snippets and applications';
COMMENT ON TABLE project_content_management IS 'Management of content lifecycle within AI projects';
COMMENT ON TABLE content_action_history IS 'Audit trail of all content actions and changes';

-- Only add comments for columns we just created in the content table
COMMENT ON COLUMN content.day_number IS 'Day number in the project timeline (1, 2, 3, etc.)';
COMMENT ON COLUMN content.is_paused IS 'Individual content pause state';
COMMENT ON COLUMN content.is_stopped IS 'Individual content stop state';
COMMENT ON COLUMN content.can_publish IS 'Whether this content can be published';
COMMENT ON COLUMN content.publish_order IS 'Order of publishing within the day';
COMMENT ON COLUMN content.content_version IS 'Version for regeneration tracking';
COMMENT ON COLUMN content.content_status IS 'Current status of the content in the publishing lifecycle';
COMMENT ON COLUMN content.engagement_prediction IS 'AI-predicted engagement metrics for the content';

COMMENT ON COLUMN projects.content_type IS 'Array of content types (video, image, carousel, etc.)';
COMMENT ON COLUMN projects.channel_types IS 'Array of channel types for content distribution';
COMMENT ON COLUMN projects.category IS 'Project category (fitness, tech, lifestyle, business, education)';
COMMENT ON COLUMN projects.duration IS 'Project duration (7days, 30days, 90days, custom)';
COMMENT ON COLUMN projects.content_frequency IS 'Content posting frequency (daily, weekly, bi-weekly)';

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Additional tables migration completed successfully - All AI features ready' as status;