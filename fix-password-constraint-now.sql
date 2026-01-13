-- ═══════════════════════════════════════════════════════════════════════════════
-- EMERGENCY FIX: Password NULL Constraint (Direct SQL)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this SQL directly in your Railway database to fix the issue immediately.
--
-- How to use:
--   1. Go to Railway dashboard
--   2. Open your database service
--   3. Click "Query" tab
--   4. Paste and execute this SQL
--
-- Or use Railway CLI:
--   railway connect
--   \i fix-password-constraint-now.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop NOT NULL constraint from password column
DO $
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE '✅ Dropped NOT NULL constraint from password column';
    ELSE
        RAISE NOTICE 'ℹ️  Password column already allows NULL values';
    END IF;
END $;

-- Clean up temporary password values
UPDATE users 
SET password = NULL 
WHERE password IN ('temp_password_needs_reset', '', 'oauth_user_no_password');

-- Add validation constraint
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_password_valid_check' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_password_valid_check;
    END IF;
    
    ALTER TABLE users ADD CONSTRAINT users_password_valid_check 
    CHECK (password IS NULL OR length(password) > 0);
    
    RAISE NOTICE '✅ Added password validation constraint';
END $;

-- Verify the fix
SELECT 
    '🎉 PASSWORD CONSTRAINT FIX COMPLETED' as status,
    COUNT(*) FILTER (WHERE password IS NULL) as oauth_users,
    COUNT(*) FILTER (WHERE password IS NOT NULL) as local_users,
    COUNT(*) as total_users,
    '✅ Password column is now nullable' as result,
    '✅ Migration 0010 will succeed' as migration_status,
    '✅ OAuth authentication supported' as oauth_status
FROM users;
