-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE TABLES CREATION - FULLY IDEMPOTENT & PRODUCTION SAFE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Creates all core tables with proper constraints for ON CONFLICT usage
-- Safe on fresh DB and partially migrated DB
-- NO FOREIGN KEYS for maximum safety
-- Date: 2026-01-10
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE CORE TABLES (NO FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sessions table (required for express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Users table with UNIQUE constraints for ON CONFLICT
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add UNIQUE constraint for email if not exists (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_key' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- ADD MISSING PASSWORD COLUMN TO USERS TABLE (CRITICAL FIX)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';

-- Projects table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL,
    template VARCHAR,
    platform VARCHAR,
    target_audience VARCHAR,
    estimated_duration VARCHAR,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    status VARCHAR DEFAULT 'active' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER,
    title VARCHAR NOT NULL,
    description TEXT,
    script TEXT,
    platform VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'draft' NOT NULL,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    thumbnail_url VARCHAR,
    video_url VARCHAR,
    tags TEXT[],
    metadata JSONB,
    ai_generated BOOLEAN DEFAULT false,
    day_number INTEGER,
    is_paused BOOLEAN DEFAULT false,
    is_stopped BOOLEAN DEFAULT false,
    can_publish BOOLEAN DEFAULT true,
    publish_order INTEGER DEFAULT 0,
    content_version INTEGER DEFAULT 1,
    last_regenerated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Metrics table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY NOT NULL,
    content_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5, 2),
    revenue NUMERIC(10, 2) DEFAULT '0',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Social Posts table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER,
    title VARCHAR NOT NULL,
    caption TEXT,
    hashtags TEXT[],
    emojis TEXT[],
    content_type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'draft' NOT NULL,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    thumbnail_url VARCHAR,
    media_urls TEXT[],
    ai_generated BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post Schedules table with proper constraints for ON CONFLICT (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS post_schedules (
    id SERIAL PRIMARY KEY NOT NULL,
    social_post_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR DEFAULT 'pending' NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB,
    recurrence VARCHAR(50) DEFAULT 'none',
    timezone VARCHAR(100) DEFAULT 'UTC',
    series_end_date TIMESTAMP,
    project_id INTEGER,
    title VARCHAR(200),
    description TEXT,
    content_type VARCHAR(50),
    duration VARCHAR(50),
    tone VARCHAR(50),
    target_audience VARCHAR(200),
    time_distribution VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Generation Tasks table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    task_type VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    result TEXT,
    status VARCHAR DEFAULT 'pending' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- AI Content Suggestions table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS ai_content_suggestions (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER,
    suggestion_type VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    content TEXT NOT NULL,
    confidence NUMERIC(3, 2) DEFAULT '0',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    content TEXT,
    thumbnail_url VARCHAR,
    rating NUMERIC(3, 2) DEFAULT '0',
    downloads INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hashtag Suggestions table
CREATE TABLE IF NOT EXISTS hashtag_suggestions (
    id SERIAL PRIMARY KEY NOT NULL,
    platform VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    hashtag VARCHAR NOT NULL,
    trend_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Engagement Patterns table with UNIQUE constraint for ON CONFLICT
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

-- Add UNIQUE constraint for ai_engagement_patterns (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_engagement_patterns_platform_category_key' 
        AND table_name = 'ai_engagement_patterns'
    ) THEN
        ALTER TABLE ai_engagement_patterns ADD CONSTRAINT ai_engagement_patterns_platform_category_key UNIQUE (platform, category);
    END IF;
END $$;

-- Notifications table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Social Accounts table (NO FOREIGN KEYS)
CREATE TABLE IF NOT EXISTS social_accounts (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    account_id VARCHAR NOT NULL,
    account_name VARCHAR NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Niches table
CREATE TABLE IF NOT EXISTS niches (
    id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    trend_score INTEGER DEFAULT 0,
    difficulty VARCHAR NOT NULL,
    profitability VARCHAR NOT NULL,
    keywords TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add UNIQUE constraint for niches name (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'niches_name_key' 
        AND table_name = 'niches'
    ) THEN
        ALTER TABLE niches ADD CONSTRAINT niches_name_key UNIQUE (name);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE ESSENTIAL INDEXES (IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Session index from original migration
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Content table indexes
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number) WHERE day_number IS NOT NULL;

-- Content metrics indexes
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);

-- AI generation tasks indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);

-- Post schedules indexes
CREATE INDEX IF NOT EXISTS idx_post_schedules_scheduled_at ON post_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_post_schedules_platform ON post_schedules(platform);
CREATE INDEX IF NOT EXISTS idx_post_schedules_status ON post_schedules(status);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON templates(is_featured) WHERE is_active = true;

-- Hashtag suggestions indexes
CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_platform ON hashtag_suggestions(platform);
CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_category ON hashtag_suggestions(category);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE AUTOMATIC TIMESTAMP UPDATE TRIGGERS
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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_schedules_updated_at ON post_schedules;
CREATE TRIGGER update_post_schedules_updated_at
    BEFORE UPDATE ON post_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hashtag_suggestions_updated_at ON hashtag_suggestions;
CREATE TRIGGER update_hashtag_suggestions_updated_at
    BEFORE UPDATE ON hashtag_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_engagement_patterns_updated_at ON ai_engagement_patterns;
CREATE TRIGGER update_ai_engagement_patterns_updated_at
    BEFORE UPDATE ON ai_engagement_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
    BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_niches_updated_at ON niches;
CREATE TRIGGER update_niches_updated_at
    BEFORE UPDATE ON niches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Core tables migration completed successfully - All ON CONFLICT constraints ready' as status;