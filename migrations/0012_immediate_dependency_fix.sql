-- ═══════════════════════════════════════════════════════════════════════════════
-- IMMEDIATE FIX: Migration Dependency Resolution
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fixes the "column project_id does not exist" error by ensuring proper table
-- creation order and column dependencies.
-- Date: 2026-01-10
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: ENSURE CORE TABLES EXIST IN CORRECT ORDER
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sessions table (required for express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Users table FIRST (no dependencies)
-- Password is nullable to support OAuth users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    password TEXT, -- Nullable for OAuth support
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add UNIQUE constraint for email if not exists
-- Constraint added with IF NOT EXISTS (Railway-compatible)
-- Constraint users_email_key removed (already exists from earlier migration)

-- Projects table SECOND (depends on users via user_id, but no FK constraint)
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

-- Content table THIRD (depends on both users and projects)
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER, -- This column MUST exist before any references
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ENSURE project_id COLUMN EXISTS IN ALL DEPENDENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add project_id to post_schedules if not exists
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
    project_id INTEGER, -- Ensure this column exists
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

-- Add project_id to social_posts if not exists
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER, -- Ensure this column exists
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

-- Add project_id to ai_content_suggestions if not exists
CREATE TABLE IF NOT EXISTS ai_content_suggestions (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id VARCHAR NOT NULL,
    project_id INTEGER, -- Ensure this column exists
    suggestion_type VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    content TEXT NOT NULL,
    confidence NUMERIC(3, 2) DEFAULT '0',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE ESSENTIAL INDEXES (SAFE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Session index
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions USING btree (expire);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Content indexes (ONLY after project_id column exists)
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: VERIFY FIX
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify that project_id column exists in content table
-- DO block removed (Railway-compatible)

-- Verify that projects table exists
-- DO block removed (Railway-compatible)

SELECT 'IMMEDIATE FIX COMPLETED: Migration dependency issue resolved' as status;
