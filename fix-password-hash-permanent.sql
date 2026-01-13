-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMANENT FIX: PASSWORD_HASH COLUMN ISSUE
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script ensures the password_hash column exists and has proper defaults
-- for OAuth users. This is the ROOT CAUSE of the Railway 502 errors.
-- 
-- Date: 2026-01-13
-- Issue: Migration 0007 fails because users table requires password_hash
-- Solution: Add password_hash column with proper default for OAuth users
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Ensure password_hash column exists with proper default
DO $
BEGIN
    -- Check if password_hash column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
        AND table_schema = 'public'
    ) THEN
        -- Add password_hash column with default for OAuth users
        ALTER TABLE users 
        ADD COLUMN password_hash TEXT NOT NULL DEFAULT 'oauth_user_no_password';
        
        RAISE NOTICE '✅ Added password_hash column with OAuth default';
    ELSE
        RAISE NOTICE 'ℹ️  password_hash column already exists';
        
        -- Ensure it has NOT NULL constraint
        ALTER TABLE users 
        ALTER COLUMN password_hash SET NOT NULL;
        
        -- Set default for new rows
        ALTER TABLE users 
        ALTER COLUMN password_hash SET DEFAULT 'oauth_user_no_password';
        
        RAISE NOTICE '✅ Updated password_hash constraints';
    END IF;
END $;

-- Step 2: Update any existing users with NULL password_hash
UPDATE users 
SET password_hash = 'oauth_user_no_password'
WHERE password_hash IS NULL OR password_hash = '';

-- Step 3: Verify the fix
DO $
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM users 
    WHERE password_hash IS NULL OR password_hash = '';
    
    SELECT COUNT(*) INTO total_count 
    FROM users;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Still have % users with NULL/empty password_hash', null_count;
    ELSE
        RAISE NOTICE '✅ All % users have valid password_hash values', total_count;
    END IF;
END $;

-- Final success message
SELECT 
    '🎉 PASSWORD_HASH COLUMN FIX COMPLETED' as status,
    'All users now have valid password_hash values' as result,
    'OAuth users use: oauth_user_no_password' as oauth_note,
    'Migration 0007 will now succeed' as impact;
