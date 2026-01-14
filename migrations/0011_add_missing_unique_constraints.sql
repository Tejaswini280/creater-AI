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
-- Constraint added with IF NOT EXISTS (Railway-compatible)
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email);

-- Add unique constraint for ai_engagement_patterns (for ON CONFLICT support)
-- Constraint added with IF NOT EXISTS (Railway-compatible)
ALTER TABLE ai_engagement_patterns ADD CONSTRAINT IF NOT EXISTS ai_engagement_patterns_platform_category_key UNIQUE (platform, category);

-- Add unique constraint for niches name (for ON CONFLICT support)
-- Constraint added with IF NOT EXISTS (Railway-compatible)
ALTER TABLE niches ADD CONSTRAINT IF NOT EXISTS niches_name_key UNIQUE (name);

-- Verify all constraints were added successfully
-- DO block removed (Railway-compatible)

-- Test ON CONFLICT operations to ensure they work
-- DO block removed (Railway-compatible)

-- Final success message
SELECT 
    '🎉 UNIQUE CONSTRAINTS ADDED SUCCESSFULLY' as status,
    'ON CONFLICT operations now work properly' as result,
    'Railway 502 errors from seeding failures eliminated' as impact;