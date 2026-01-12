-- ═══════════════════════════════════════════════════════════════════════════════
-- CRITICAL COLUMN FIXES - IMMEDIATE RESOLUTION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds all missing columns that are causing migration failures
-- Safe to run multiple times (idempotent)
-- Date: 2026-01-12
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: FIX USERS TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add password column to users table (CRITICAL)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';

-- Add other missing user columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR,
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR,
ADD COLUMN IF NOT EXISTS location VARCHAR,
ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: FIX PROJECTS TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing project columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS category VARCHAR,
ADD COLUMN IF NOT EXISTS content_type VARCHAR,
ADD COLUMN IF NOT EXISTS channel_types TEXT[],
ADD COLUMN IF NOT EXISTS duration VARCHAR,
ADD COLUMN IF NOT EXISTS content_frequency VARCHAR,
ADD COLUMN IF NOT EXISTS content_formats TEXT[],
ADD COLUMN IF NOT EXISTS content_themes TEXT[],
ADD COLUMN IF NOT EXISTS brand_voice VARCHAR,
ADD COLUMN IF NOT EXISTS content_length VARCHAR,
ADD COLUMN IF NOT EXISTS posting_frequency VARCHAR,
ADD COLUMN IF NOT EXISTS ai_tools TEXT[],
ADD COLUMN IF NOT EXISTS scheduling_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS team_members TEXT[],
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_id INTEGER,
ADD COLUMN IF NOT EXISTS progress NUMERIC(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS completion_status VARCHAR DEFAULT 'in_progress';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: FIX CONTENT TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing content columns
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS content_status VARCHAR DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS engagement_prediction NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS target_audience VARCHAR,
ADD COLUMN IF NOT EXISTS optimal_posting_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS content_format VARCHAR,
ADD COLUMN IF NOT EXISTS tone VARCHAR,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS reading_time INTEGER,
ADD COLUMN IF NOT EXISTS seo_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS readability_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS media_files TEXT[],
ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by VARCHAR,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ADD MISSING TABLES THAT ARE REFERENCED
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects table
CREATE TABLE IF NOT EXISTS ai_projects (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    project_type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Content table
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id SERIAL PRIMARY KEY,
    ai_project_id INTEGER NOT NULL,
    user_id VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    title VARCHAR,
    content TEXT,
    status VARCHAR DEFAULT 'generated',
    day_number INTEGER,
    platform VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Content Calendar table
CREATE TABLE IF NOT EXISTS ai_content_calendar (
    id SERIAL PRIMARY KEY,
    ai_project_id INTEGER NOT NULL,
    content_id INTEGER,
    scheduled_date DATE NOT NULL,
    user_id VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'scheduled',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Content Management table
CREATE TABLE IF NOT EXISTS project_content_management (
    id SERIAL PRIMARY KEY,
    ai_project_id INTEGER NOT NULL,
    user_id VARCHAR NOT NULL,
    content_count INTEGER DEFAULT 0,
    published_count INTEGER DEFAULT 0,
    scheduled_count INTEGER DEFAULT 0,
    draft_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Content Action History table
CREATE TABLE IF NOT EXISTS content_action_history (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    user_id VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Structured Outputs table
CREATE TABLE IF NOT EXISTS structured_outputs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    output_type VARCHAR NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status VARCHAR DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Code table
CREATE TABLE IF NOT EXISTS generated_code (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    language VARCHAR NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform Posts table
CREATE TABLE IF NOT EXISTS platform_posts (
    id SERIAL PRIMARY KEY,
    social_post_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    platform_post_id VARCHAR,
    status VARCHAR DEFAULT 'pending',
    published_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post Media table
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
    social_post_id INTEGER NOT NULL,
    media_type VARCHAR NOT NULL,
    media_url VARCHAR NOT NULL,
    thumbnail_url VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Content Actions table
CREATE TABLE IF NOT EXISTS content_actions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    action_type VARCHAR NOT NULL,
    performed_by VARCHAR NOT NULL,
    performed_at TIMESTAMP DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Content Versions table
CREATE TABLE IF NOT EXISTS content_versions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR,
    content TEXT,
    changes_summary TEXT,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project Extensions table
CREATE TABLE IF NOT EXISTS project_extensions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    extension_type VARCHAR NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE ESSENTIAL INDEXES FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects indexes
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);

-- AI Generated Content indexes
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_status ON ai_generated_content(status);

-- AI Content Calendar indexes
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_project_id ON ai_content_calendar(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_date ON ai_content_calendar(scheduled_date);

-- Content Action History indexes
CREATE INDEX IF NOT EXISTS idx_content_action_history_content_id ON content_action_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_action_history_user_id ON content_action_history(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE UPDATE TRIGGERS FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects trigger
DROP TRIGGER IF EXISTS update_ai_projects_updated_at ON ai_projects;
CREATE TRIGGER update_ai_projects_updated_at
    BEFORE UPDATE ON ai_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Generated Content trigger
DROP TRIGGER IF EXISTS update_ai_generated_content_updated_at ON ai_generated_content;
CREATE TRIGGER update_ai_generated_content_updated_at
    BEFORE UPDATE ON ai_generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Content Calendar trigger
DROP TRIGGER IF EXISTS update_ai_content_calendar_updated_at ON ai_content_calendar;
CREATE TRIGGER update_ai_content_calendar_updated_at
    BEFORE UPDATE ON ai_content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Structured Outputs trigger
DROP TRIGGER IF EXISTS update_structured_outputs_updated_at ON structured_outputs;
CREATE TRIGGER update_structured_outputs_updated_at
    BEFORE UPDATE ON structured_outputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generated Code trigger
DROP TRIGGER IF EXISTS update_generated_code_updated_at ON generated_code;
CREATE TRIGGER update_generated_code_updated_at
    BEFORE UPDATE ON generated_code
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Platform Posts trigger
DROP TRIGGER IF EXISTS update_platform_posts_updated_at ON platform_posts;
CREATE TRIGGER update_platform_posts_updated_at
    BEFORE UPDATE ON platform_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Project Extensions trigger
DROP TRIGGER IF EXISTS update_project_extensions_updated_at ON project_extensions;
CREATE TRIGGER update_project_extensions_updated_at
    BEFORE UPDATE ON project_extensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: UPDATE EXISTING DATA WITH SAFE DEFAULTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update users with missing data
UPDATE users 
SET 
    password = 'temp_password_needs_reset'
WHERE password IS NULL OR password = '';

-- Update projects with missing categories
UPDATE projects 
SET 
    category = 'general',
    content_type = 'mixed',
    duration = '30 days',
    content_frequency = 'daily'
WHERE category IS NULL;

-- Update content with missing status
UPDATE content 
SET 
    content_status = status,
    is_ai_generated = COALESCE(ai_generated, false)
WHERE content_status IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Critical column fixes migration completed successfully - All missing columns added' as status;