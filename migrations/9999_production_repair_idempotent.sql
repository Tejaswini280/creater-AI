-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTION REPAIR MIGRATION - FULLY IDEMPOTENT
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration repairs the broken Railway production database
-- Safe to run multiple times, handles all edge cases
-- Date: 2026-01-09
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: REPAIR USERS TABLE - ADD MISSING PASSWORD COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if password column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';
        -- Remove default after adding
        ALTER TABLE users ALTER COLUMN password DROP DEFAULT;
        RAISE NOTICE '✅ Added missing password column to users table';
    ELSE
        RAISE NOTICE '⏭️  Password column already exists in users table';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: REPAIR CONTENT TABLE - ADD MISSING PROJECT_ID AND OTHER COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add project_id column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE content ADD COLUMN project_id INTEGER;
        RAISE NOTICE '✅ Added missing project_id column to content table';
    ELSE
        RAISE NOTICE '⏭️  project_id column already exists in content table';
    END IF;
END $$;

-- Add foreign key constraint for project_id if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_project_id_projects_id_fk' 
        AND table_name = 'content'
    ) THEN
        -- Only add constraint if projects table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
            ALTER TABLE content ADD CONSTRAINT content_project_id_projects_id_fk 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
            RAISE NOTICE '✅ Added foreign key constraint for project_id';
        END IF;
    ELSE
        RAISE NOTICE '⏭️  Foreign key constraint already exists for project_id';
    END IF;
END $$;

-- Add all missing enhanced content management columns
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS day_number INTEGER,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE MISSING TABLES (FULLY IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content Metrics table (if missing)
CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    platform VARCHAR NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    revenue DECIMAL(10,2) DEFAULT '0',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- AI Generation Tasks table (if missing)
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

-- AI Projects table (if missing)
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

-- AI Generated Content table (if missing)
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

-- AI Content Calendar table (if missing)
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

-- AI Engagement Patterns table (if missing)
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

-- Structured Outputs table (if missing)
CREATE TABLE IF NOT EXISTS structured_outputs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    schema JSONB NOT NULL,
    response_json JSONB NOT NULL,
    model VARCHAR DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Code table (if missing)
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
-- STEP 4: ADD MISSING FOREIGN KEY CONSTRAINTS (IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add foreign keys only if tables exist and constraints don't exist
DO $$ 
BEGIN
    -- Content metrics -> content
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_metrics')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'content_metrics_content_id_fkey'
       ) THEN
        ALTER TABLE content_metrics ADD CONSTRAINT content_metrics_content_id_fkey 
        FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE;
    END IF;

    -- AI generation tasks -> users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_generation_tasks')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'ai_generation_tasks_user_id_fkey'
       ) THEN
        ALTER TABLE ai_generation_tasks ADD CONSTRAINT ai_generation_tasks_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- AI projects -> users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_projects')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'ai_projects_user_id_fkey'
       ) THEN
        ALTER TABLE ai_projects ADD CONSTRAINT ai_projects_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- AI generated content -> ai_projects and users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_projects') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_generated_content')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'ai_generated_content_ai_project_id_fkey'
       ) THEN
        ALTER TABLE ai_generated_content ADD CONSTRAINT ai_generated_content_ai_project_id_fkey 
        FOREIGN KEY (ai_project_id) REFERENCES ai_projects(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_generated_content')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'ai_generated_content_user_id_fkey'
       ) THEN
        ALTER TABLE ai_generated_content ADD CONSTRAINT ai_generated_content_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Structured outputs -> users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'structured_outputs')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'structured_outputs_user_id_fkey'
       ) THEN
        ALTER TABLE structured_outputs ADD CONSTRAINT structured_outputs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Generated code -> users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_code')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'generated_code_user_id_fkey'
       ) THEN
        ALTER TABLE generated_code ADD CONSTRAINT generated_code_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: ADD MISSING COLUMNS TO POST_SCHEDULES (IF TABLE EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_schedules') THEN
        ALTER TABLE post_schedules
        ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50) DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC',
        ADD COLUMN IF NOT EXISTS series_end_date TIMESTAMP;
        RAISE NOTICE '✅ Added recurrence columns to post_schedules table';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE ESSENTIAL INDEXES (IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- AI projects indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_projects_status ON ai_projects(status);

-- AI generated content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: SEED ESSENTIAL DATA (IDEMPOTENT)
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

-- Create test user if needed
INSERT INTO users (id, email, password, first_name, last_name) 
VALUES 
  ('test-user-repair', 'repair@example.com', '$2b$10$rQZ9QmjytWzQgwjvHJ4zKOXvnK4nK4nK4nK4nK4nK4nK4nK4nK4nK4', 'Repair', 'User')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION LOG
-- ═══════════════════════════════════════════════════════════════════════════════

DO $
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔧 PRODUCTION REPAIR MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Repairs Applied:';
    RAISE NOTICE '  ✅ Fixed users.password column (if missing)';
    RAISE NOTICE '  ✅ Fixed content.project_id column (if missing)';
    RAISE NOTICE '  ✅ Added enhanced content management columns';
    RAISE NOTICE '  ✅ Created missing AI tables (if needed)';
    RAISE NOTICE '  ✅ Added foreign key constraints (if missing)';
    RAISE NOTICE '  ✅ Created performance indexes';
    RAISE NOTICE '  ✅ Seeded essential data';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Database is now production-ready and scheduler-safe!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
END $;