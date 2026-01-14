-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0001 - CORE TABLES CREATION (IDEMPOTENT VERSION)
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration creates ALL core tables required by the application.
-- REPLACES the retired 0001_core_tables_clean.sql migration.
-- 
-- PRODUCTION SAFE GUARANTEES:
-- ✅ Safe for fresh databases (CREATE TABLE IF NOT EXISTS)
-- ✅ Safe for partially migrated databases (IF NOT EXISTS checks)
-- ✅ Safe for fully migrated databases (no-op if tables exist)
-- ✅ NO FOREIGN KEY CONSTRAINTS (prevents migration failures)
-- ✅ NO DATA LOSS (only creates missing tables)
-- ✅ PostgreSQL 15 compatible
-- 
-- Date: 2026-01-14
-- Purpose: Ensure all core tables exist before other migrations run
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE CORE TABLES IN DEPENDENCY ORDER
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sessions table (required for express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Users table (no dependencies)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table (depends on users, but NO FK constraint)
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

-- Content table (depends on users and projects, but NO FK constraints)
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
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Metrics table (depends on content, but NO FK constraint)
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
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Post Schedules table (depends on social_posts, but NO FK constraint)
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
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Posts table (depends on users and projects, but NO FK constraints)
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
-- STEP 2: CREATE ESSENTIAL INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Session index (required by express-session)
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Content metrics indexes
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);

-- Post schedules indexes
CREATE INDEX IF NOT EXISTS idx_post_schedules_scheduled_at ON post_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_post_schedules_platform ON post_schedules(platform);
CREATE INDEX IF NOT EXISTS idx_post_schedules_status ON post_schedules(status);

-- Social posts indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_project_id ON social_posts(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

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

-- Create triggers for automatic timestamp updates
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

DROP TRIGGER IF EXISTS update_post_schedules_updated_at ON post_schedules;
CREATE TRIGGER update_post_schedules_updated_at
    BEFORE UPDATE ON post_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Core tables migration completed successfully - All required tables created' as status;
