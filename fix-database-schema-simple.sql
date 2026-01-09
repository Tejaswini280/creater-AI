-- ═══════════════════════════════════════════════════════════════════════════════
-- SIMPLE DATABASE SCHEMA FIX
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script fixes the critical database schema issues step by step
-- Date: 2026-01-09
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: FIX USERS TABLE - ADD MISSING PASSWORD COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if password column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'temp_password_needs_reset';
    ALTER TABLE users ALTER COLUMN password DROP DEFAULT;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: FIX CONTENT TABLE - ADD MISSING PROJECT_ID COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if project_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE content ADD COLUMN project_id INTEGER;
  END IF;
END $$;

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
-- STEP 3: ADD MISSING COLUMNS TO CONTENT TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing columns one by one
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'day_number'
  ) THEN
    ALTER TABLE content ADD COLUMN day_number INTEGER;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'is_paused'
  ) THEN
    ALTER TABLE content ADD COLUMN is_paused BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'is_stopped'
  ) THEN
    ALTER TABLE content ADD COLUMN is_stopped BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'can_publish'
  ) THEN
    ALTER TABLE content ADD COLUMN can_publish BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'publish_order'
  ) THEN
    ALTER TABLE content ADD COLUMN publish_order INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'content_version'
  ) THEN
    ALTER TABLE content ADD COLUMN content_version INTEGER DEFAULT 1;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'last_regenerated_at'
  ) THEN
    ALTER TABLE content ADD COLUMN last_regenerated_at TIMESTAMP;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE AI ENGAGEMENT PATTERNS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: SEED ESSENTIAL DATA
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
  ('Tech Tutorial Script', 'Educational tech content template', 'tech', 'Video Script', 'In this tutorial, we will explore [TOPIC] and learn how to [OBJECTIVE]. Let us get started!', 4.9, 980),
  ('Business Growth Tips', 'Business advice content template', 'business', 'Social Media Post', 'Here are 3 proven strategies to grow your business: 1) [TIP 1] 2) [TIP 2] 3) [TIP 3]', 4.7, 750),
  ('Lifestyle Inspiration', 'Lifestyle and wellness content template', 'lifestyle', 'Social Media Post', 'Living your best life starts with small daily choices ✨ #lifestyle #wellness', 4.6, 650)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE TEST USER IF NEEDED
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create a test user for development/testing (idempotent)
INSERT INTO users (id, email, password, first_name, last_name) 
VALUES 
  ('test-user-1', 'test@example.com', '$2b$10$rQZ9QmjytWzQgwjvHJ4zKOXvnK4nK4nK4nK4nK4nK4nK4nK4nK4nK4', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema fix completed successfully!';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '  • Added missing password column to users table';
    RAISE NOTICE '  • Added missing project_id column to content table';
    RAISE NOTICE '  • Added missing columns to content table';
    RAISE NOTICE '  • Created AI engagement patterns table';
    RAISE NOTICE '  • Seeded essential data';
    RAISE NOTICE '  • Created test user';
    RAISE NOTICE '';
    RAISE NOTICE 'The scheduler service should now work without errors!';
END $$;