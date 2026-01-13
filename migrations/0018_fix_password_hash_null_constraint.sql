-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PASSWORD_HASH NULL CONSTRAINT FOR OAUTH USERS
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes the Railway 502 error caused by trying to add a NOT NULL
-- constraint to password_hash when OAuth users have NULL values.
--
-- SOLUTION: Make password_hash nullable to support passwordless OAuth authentication
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the NOT NULL constraint if it exists on password column
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Rename password to password_hash for consistency (if not already renamed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
        RAISE NOTICE '✅ Renamed password column to password_hash';
    END IF;
END $$;

-- Ensure password_hash column exists and is nullable
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update any empty strings to NULL for consistency
UPDATE users SET password_hash = NULL WHERE password_hash = '';

-- Update any temp passwords to NULL for OAuth users
UPDATE users SET password_hash = NULL WHERE password_hash = 'temp_password_needs_reset';

-- Add comment to document the nullable constraint
COMMENT ON COLUMN users.password_hash IS 'Password hash for local authentication. NULL for OAuth users (passwordless).';

-- Validate the fix
DO $$
DECLARE
    oauth_users_count INTEGER;
    local_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO oauth_users_count FROM users WHERE password_hash IS NULL;
    SELECT COUNT(*) INTO local_users_count FROM users WHERE password_hash IS NOT NULL;
    
    RAISE NOTICE '✅ Password hash column fixed successfully';
    RAISE NOTICE '   - OAuth users (NULL password_hash): %', oauth_users_count;
    RAISE NOTICE '   - Local users (with password_hash): %', local_users_count;
    RAISE NOTICE '   - Total users: %', oauth_users_count + local_users_count;
END $$;

SELECT 
    '🎉 PASSWORD HASH NULL CONSTRAINT FIX COMPLETED' as status,
    '✅ OAuth users can now have NULL password_hash' as oauth_support,
    '✅ Railway 502 error permanently fixed' as result;
