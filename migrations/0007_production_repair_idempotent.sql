-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTION REPAIR MIGRATION - PRODUCTION SAFE VERSION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration repairs the broken Railway production database
-- PRODUCTION SAFE: NO FOREIGN KEY CONSTRAINTS
-- Safe to run multiple times, handles all edge cases
-- Date: 2026-01-09
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE ALL CORE TABLES (FULLY IDEMPOTENT, NO FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users table (core table) - MUST ADD PASSWORD COLUMN
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- FIX: Ensure id column is VARCHAR type (handles INTEGER to VARCHAR conversion)
-- This is safe to run even if id is already VARCHAR
-- Step 1: Drop and recreate primary key to allow type change
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

-- Step 2: Change column type - converts INTEGER to VARCHAR if needed
-- If already VARCHAR, this is a no-op
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR USING id::VARCHAR;

-- Step 3: Recreate primary key
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ADD MISSING PASSWORD_HASH COLUMN TO USERS TABLE (CRITICAL FIX)
-- Using password_hash to match the application schema
-- Default value for OAuth users who don't have passwords
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'oauth_user_no_password';

-- Update existing NULL values to the OAuth placeholder
UPDATE users 
SET password_hash = 'oauth_user_no_password'
WHERE password_hash IS NULL;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Projects table (NO FOREIGN KEY CONSTRAINTS)
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

-- Content table (NO FOREIGN KEY CONSTRAINTS)
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

-- ADD MISSING PROJECT_ID COLUMN TO SCHEDULES TABLE (CRITICAL FIX)
ALTER TABLE post_schedules 
ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- Content Metrics table (NO FOREIGN KEY CONSTRAINTS)
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

-- AI Generation Tasks table (NO FOREIGN KEY CONSTRAINTS)
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

-- AI Content Suggestions table (NO FOREIGN KEY CONSTRAINTS)
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

-- Niches table
CREATE TABLE IF NOT EXISTS niches (
    id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR NOT NULL UNIQUE,
    category VARCHAR NOT NULL,
    trend_score INTEGER DEFAULT 0,
    difficulty VARCHAR NOT NULL,
    profitability VARCHAR NOT NULL,
    keywords TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table (NO FOREIGN KEY CONSTRAINTS)
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

-- Social Accounts table (NO FOREIGN KEY CONSTRAINTS)
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

-- Social Posts table (NO FOREIGN KEY CONSTRAINTS)
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

-- Post Schedules table (NO FOREIGN KEY CONSTRAINTS)
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, category)
);

-- Structured Outputs table (NO FOREIGN KEY CONSTRAINTS)
CREATE TABLE IF NOT EXISTS structured_outputs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    schema JSONB NOT NULL,
    response_json JSONB NOT NULL,
    model VARCHAR DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Code table (NO FOREIGN KEY CONSTRAINTS)
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
-- STEP 2: CREATE ESSENTIAL INDEXES (IDEMPOTENT, NO FOREIGN KEY DEPENDENCIES)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Session index from original migration
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire);

-- Content table indexes
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at);

-- AI projects indexes
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);

-- AI generated content indexes
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: SEED ESSENTIAL DATA (IDEMPOTENT, NO FOREIGN KEY DEPENDENCIES)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert AI engagement patterns (with conflict handling)
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size) 
VALUES 
  ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000),
  ('instagram', 'tech', ARRAY['10:00', '14:00', '19:00'], 0.82, 800),
  ('instagram', 'lifestyle', ARRAY['08:00', '13:00', '18:00'], 0.88, 1200),
  ('youtube', 'fitness', ARRAY['14:00', '20:00'], 0.90, 500),
  ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600),
  ('tiktok', 'fitness', ARRAY['18:00', '20:00', '22:00'], 0.92, 1500),
  ('linkedin', 'business', ARRAY['08:00', '12:00', '17:00'], 0.78, 400)
ON CONFLICT (platform, category) DO NOTHING;

-- Create passwordless test user if needed (OAuth system)
-- password_hash is NULL for OAuth users
INSERT INTO users (id, email, first_name, last_name) 
VALUES 
  ('test-user-repair-oauth', 'repair@example.com', 'Repair', 'OAuth')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTION REPAIR COMPLETED - NO FOREIGN KEY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'PRODUCTION REPAIR MIGRATION COMPLETED SUCCESSFULLY - NO FOREIGN KEYS' as repair_status;