-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD MISSING UNIQUE CONSTRAINTS - CRITICAL FIX FOR ON CONFLICT OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration adds the missing UNIQUE constraints that are required for
-- ON CONFLICT operations to work properly. Without these constraints,
-- seeding operations fail and cause Railway 502 errors.
-- 
-- Date: 2026-01-10
-- Target: Fix ON CONFLICT operations in seeding
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add unique constraint for users email (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'users_email_key' 
        AND tc.table_name = 'users'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE 'Added UNIQUE constraint: users_email_key';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists: users_email_key';
    END IF;
END $$;

-- Add unique constraint for ai_engagement_patterns (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'ai_engagement_patterns_platform_category_key' 
        AND tc.table_name = 'ai_engagement_patterns'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE ai_engagement_patterns ADD CONSTRAINT ai_engagement_patterns_platform_category_key UNIQUE (platform, category);
        RAISE NOTICE 'Added UNIQUE constraint: ai_engagement_patterns_platform_category_key';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists: ai_engagement_patterns_platform_category_key';
    END IF;
END $$;

-- Add unique constraint for niches name (for ON CONFLICT support)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'niches_name_key' 
        AND tc.table_name = 'niches'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE niches ADD CONSTRAINT niches_name_key UNIQUE (name);
        RAISE NOTICE 'Added UNIQUE constraint: niches_name_key';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists: niches_name_key';
    END IF;
END $$;

-- Verify all constraints were added successfully
DO $$
DECLARE
    missing_constraints TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check users email constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'users' 
        AND tc.constraint_name = 'users_email_key'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'UNIQUE'
    ) THEN
        missing_constraints := array_append(missing_constraints, 'users.users_email_key');
    END IF;
    
    -- Check ai_engagement_patterns constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'ai_engagement_patterns' 
        AND tc.constraint_name = 'ai_engagement_patterns_platform_category_key'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'UNIQUE'
    ) THEN
        missing_constraints := array_append(missing_constraints, 'ai_engagement_patterns.ai_engagement_patterns_platform_category_key');
    END IF;
    
    -- Check niches constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'niches' 
        AND tc.constraint_name = 'niches_name_key'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'UNIQUE'
    ) THEN
        missing_constraints := array_append(missing_constraints, 'niches.niches_name_key');
    END IF;
    
    IF array_length(missing_constraints, 1) > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Still missing UNIQUE constraints: %', array_to_string(missing_constraints, ', ');
    ELSE
        RAISE NOTICE '✅ All required UNIQUE constraints verified successfully';
    END IF;
END $$;

-- Test ON CONFLICT operations to ensure they work
DO $$
BEGIN
    -- Test user insertion with ON CONFLICT
    INSERT INTO users (id, email, password, first_name, last_name) 
    VALUES ('test-constraint-check', 'test-constraint@example.com', 'test-password', 'Test', 'Constraint')
    ON CONFLICT (email) DO UPDATE SET 
      first_name = EXCLUDED.first_name,
      updated_at = NOW();
    
    -- Test AI engagement pattern insertion with ON CONFLICT
    INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score) 
    VALUES ('test-platform', 'test-category', ARRAY['12:00'], 0.5)
    ON CONFLICT (platform, category) DO UPDATE SET 
      engagement_score = EXCLUDED.engagement_score,
      updated_at = NOW();
    
    -- Test niche insertion with ON CONFLICT
    INSERT INTO niches (name, category, trend_score, difficulty, profitability, keywords, description)
    VALUES ('Test Niche', 'test', 50, 'easy', 'low', ARRAY['test'], 'Test niche for constraint verification')
    ON CONFLICT (name) DO UPDATE SET 
      trend_score = EXCLUDED.trend_score,
      updated_at = NOW();
    
    -- Clean up test data
    DELETE FROM users WHERE id = 'test-constraint-check';
    DELETE FROM ai_engagement_patterns WHERE platform = 'test-platform' AND category = 'test-category';
    DELETE FROM niches WHERE name = 'Test Niche';
    
    RAISE NOTICE '✅ All ON CONFLICT operations tested successfully';
END $$;

-- Final success message
SELECT 
    '🎉 UNIQUE CONSTRAINTS ADDED SUCCESSFULLY' as status,
    'ON CONFLICT operations now work properly' as result,
    'Railway 502 errors from seeding failures eliminated' as impact;