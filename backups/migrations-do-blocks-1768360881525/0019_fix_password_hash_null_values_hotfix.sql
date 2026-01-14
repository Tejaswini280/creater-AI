-- ═══════════════════════════════════════════════════════════════════════════════
-- HOTFIX: Fix password_hash NULL constraint violation
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes the immediate issue where users table has password_hash
-- column with NOT NULL constraint but contains NULL values (OAuth users)
--
-- Date: 2026-01-13
-- Target: Railway Production Database
-- Purpose: Allow NULL password_hash for OAuth users
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Drop NOT NULL constraint from password_hash column
DO $
BEGIN
    -- Check if password_hash column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop the NOT NULL constraint
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        RAISE NOTICE '✅ Dropped NOT NULL constraint from password_hash column';
    ELSE
        RAISE NOTICE 'ℹ️ password_hash column already allows NULL or does not exist';
    END IF;
END $;

-- STEP 2: Update any empty string password_hash values to NULL
UPDATE users 
SET password_hash = NULL 
WHERE password_hash = '' OR password_hash = 'oauth_user_no_password' OR password_hash = 'temp_password_needs_reset';

-- STEP 3: Ensure password column also allows NULL (if it exists)
DO $
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE '✅ Ensured password column allows NULL';
    END IF;
END $;

-- STEP 4: Add helpful comment
COMMENT ON COLUMN users.password_hash IS 'Password hash for local authentication. NULL for OAuth users.';

-- Success message
SELECT 
    '✅ Password hash NULL constraint fix completed' as status,
    COUNT(*) FILTER (WHERE password_hash IS NULL) as oauth_users,
    COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as local_users
FROM users;
