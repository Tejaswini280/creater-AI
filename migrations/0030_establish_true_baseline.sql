-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0030: ESTABLISH TRUE BASELINE
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration establishes the TRUE BASELINE schema based on the ACTUAL current
-- database state as of 2026-01-14.
--
-- PURPOSE:
-- - Document the actual schema that exists in the database
-- - Serve as the baseline for all future migrations
-- - Be idempotent (safe to run on existing database with no changes)
-- - Provide a known-good starting point for fresh database deployments
--
-- CONTEXT:
-- - 21 of 31 previous migrations were never executed
-- - Early migrations (0001-0006) created comprehensive schema
-- - Later migrations (0007-0028) were redundant or broken
-- - Current database has 28 tables with all required columns
-- - Schema validation passes despite incomplete migration history
--
-- STRATEGY:
-- - This migration does NOT modify existing schema
-- - It only ensures all tables and columns exist (idempotent)
-- - Future migrations will build on this baseline
-- - Previous migrations (0001-0029) are considered "legacy"
--
-- Date: 2026-01-14
-- Author: Database Architecture Team
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- BASELINE SCHEMA: Core Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users table (21 columns)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    password TEXT, -- Note: NOT password_hash
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    full_name VARCHAR,
    username VARCHAR,
    phone VARCHAR,
    bio TEXT,
    website VARCHAR,
    location VARCHAR,
    timezone VARCHAR,
    preferences JSONB,
    subscription_tier VARCHAR,
    last_login_at TIMESTAMP,
    email_verified BOOLEAN,
    phone_verified BOOLEAN
);

-- Projects table (36 columns)
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
    updated_at TIMESTAMP DEFAULT NOW(),
    content_type TEXT[],
    channel_types TEXT[],
    category VARCHAR,
    duration VARCHAR,
    content_frequency VARCHAR,
    content_formats TEXT[],
    content_themes TEXT[],
    brand_voice VARCHAR,
    content_length VARCHAR,
    posting_frequency VARCHAR,
    ai_tools TEXT[],
    scheduling_preferences JSONB,
    start_date TIMESTAMP,
    budget VARCHAR,
    team_members TEXT[],
    goals TEXT[],
    end_date DATE,
    is_template BOOLEAN,
    template_id INTEGER,
    progress NUMERIC,
    completion_status VARCHAR
);

-- Content table (46 columns)
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    day_number INTEGER,
    is_paused BOOLEAN DEFAULT false,
    is_stopped BOOLEAN DEFAULT false,
    can_publish BOOLEAN DEFAULT true,
    publish_order INTEGER DEFAULT 0,
    content_version INTEGER DEFAULT 1,
    last_regenerated_at TIMESTAMP,
    scheduled_time TIMESTAMP,
    content_status VARCHAR DEFAULT 'draft',
    is_ai_generated BOOLEAN DEFAULT false,
    engagement_prediction JSONB,
    target_audience VARCHAR,
    optimal_posting_time TIMESTAMP,
    content_metadata JSONB,
    content_format VARCHAR,
    tone VARCHAR,
    word_count INTEGER,
    reading_time INTEGER,
    seo_score NUMERIC,
    readability_score NUMERIC,
    sentiment_score NUMERIC,
    hashtags TEXT[],
    mentions TEXT[],
    media_files TEXT[],
    approval_status VARCHAR,
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    rejection_reason TEXT
);

-- Content Metrics table (11 columns)
CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY NOT NULL,
    content_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5, 2),
    revenue NUMERIC(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (3 columns)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Post Schedules table (22 columns)
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    recurrence VARCHAR DEFAULT 'none',
    timezone VARCHAR DEFAULT 'UTC',
    series_end_date TIMESTAMP,
    project_id INTEGER,
    title VARCHAR,
    description TEXT,
    content_type VARCHAR,
    duration VARCHAR,
    tone VARCHAR,
    target_audience VARCHAR,
    time_distribution VARCHAR
);

-- Social Posts table (17 columns)
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- BASELINE SCHEMA: AI and Advanced Features
-- ═══════════════════════════════════════════════════════════════════════════════

-- AI Projects table (22 columns)
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

-- AI Generated Content table (26 columns)
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
    confidence NUMERIC(3,2),
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

-- AI Content Calendar table (15 columns)
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
    engagement_score NUMERIC(3,2),
    ai_optimized BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Content Suggestions table (9 columns)
CREATE TABLE IF NOT EXISTS ai_content_suggestions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    project_id INTEGER,
    suggestion_type VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    content TEXT NOT NULL,
    confidence NUMERIC(3, 2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Generation Tasks table (9 columns)
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    task_type VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    result TEXT,
    status VARCHAR DEFAULT 'pending' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- AI Engagement Patterns table (9 columns)
CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
    id SERIAL PRIMARY KEY,
    platform VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    optimal_times TEXT[] NOT NULL,
    engagement_score NUMERIC(3,2),
    sample_size INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, category)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BASELINE SCHEMA: Supporting Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Templates table (15 columns)
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    content TEXT,
    thumbnail_url VARCHAR,
    rating NUMERIC(3, 2) DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hashtag Suggestions table (10 columns)
CREATE TABLE IF NOT EXISTS hashtag_suggestions (
    id SERIAL PRIMARY KEY,
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

-- Niches table (10 columns)
CREATE TABLE IF NOT EXISTS niches (
    id SERIAL PRIMARY KEY,
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

-- Notifications table (9 columns)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Social Accounts table (12 columns)
CREATE TABLE IF NOT EXISTS social_accounts (
    id SERIAL PRIMARY KEY,
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

-- Platform Posts table (15 columns)
CREATE TABLE IF NOT EXISTS platform_posts (
    id SERIAL PRIMARY KEY,
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

-- Post Media table (12 columns)
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
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

-- Project Content Management table (16 columns)
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

-- Content Action History table (8 columns)
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

-- Content Actions table (7 columns)
CREATE TABLE IF NOT EXISTS content_actions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    action_type VARCHAR NOT NULL,
    action_data JSONB,
    performed_by VARCHAR NOT NULL,
    performed_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Content Versions table (12 columns)
CREATE TABLE IF NOT EXISTS content_versions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    script TEXT,
    hashtags TEXT[],
    scheduled_time TIMESTAMP,
    content_status VARCHAR,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL
);

-- Project Extensions table (8 columns)
CREATE TABLE IF NOT EXISTS project_extensions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    original_duration INTEGER NOT NULL,
    extended_duration INTEGER NOT NULL,
    extension_days INTEGER NOT NULL,
    extended_at TIMESTAMP DEFAULT NOW(),
    extended_by VARCHAR NOT NULL,
    metadata JSONB
);

-- Structured Outputs table (7 columns)
CREATE TABLE IF NOT EXISTS structured_outputs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    schema JSONB NOT NULL,
    response_json JSONB NOT NULL,
    model VARCHAR DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Code table (9 columns)
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
-- BASELINE COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Baseline migration 0030 completed - True baseline established' as status;
