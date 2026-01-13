-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0010: REPLACED WITH SAFE VERSION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration has been replaced with a safe version that:
-- 1. Does NOT create any users (to avoid password constraint issues)
-- 2. Only ensures password column is nullable
-- 3. Is fully idempotent
--
-- The original migration 0010 was causing 502 errors due to password constraints.
-- This replacement ensures the application can start successfully.
--
-- Date: 2026-01-13
-- Status: SAFE REPLACEMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- CRITICAL FIX: Ensure password column is nullable
DO $
BEGIN
    -- Add password column if it doesn't exist (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE '✅ Added password column (nullable)';
    END IF;

    -- Remove NOT NULL constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from password column';
    END IF;
END $;

-- Add unique constraint on email if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'users_email_key' 
        AND tc.table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE '✅ Added UNIQUE constraint on users.email';
    END IF;
END $;

-- Clean up any invalid password values
UPDATE users 
SET password = NULL 
WHERE password = '' 
   OR password = 'temp_password_needs_reset'
   OR password = 'null'
   OR password = 'undefined';

-- Success message
SELECT 
    '🎉 MIGRATION 0010 SAFE REPLACEMENT COMPLETED' as status,
    '✅ Password column is nullable' as fix_1,
    '✅ OAuth users are supported' as fix_2,
    '✅ No users created (avoiding constraint issues)' as fix_3,
    '🚀 Application can now start' as result;
