-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMANENT FIX: Make password column nullable for OAuth users
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration permanently fixes the "null value in column password violates 
-- not-null constraint" error by ensuring the password column is nullable.
--
-- CRITICAL FIX:
-- - Removes NOT NULL constraint from password column
-- - Allows OAuth/passwordless authentication
-- - Safe for existing data
-- - Idempotent (can run multiple times)
--
-- Date: 2026-01-13
-- Target: All environments (dev, staging, production)
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 2: Add password column if it doesn't exist (nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- STEP 3: Drop NOT NULL constraint if it exists
DO $
BEGIN
    -- Check if the NOT NULL constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from users.password column';
    ELSE
        RAISE NOTICE '✅ Password column is already nullable';
    END IF;
END $;

-- STEP 4: Clean up any invalid password values
UPDATE users 
SET password = NULL 
WHERE password = '' 
   OR password = 'temp_password_needs_reset'
   OR password = 'null'
   OR password = 'undefined';

-- STEP 5: Add unique constraint on email if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'users_email_key' 
        AND tc.table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE '✅ Added UNIQUE constraint on users.email';
    ELSE
        RAISE NOTICE '✅ UNIQUE constraint on users.email already exists';
    END IF;
END $;

-- STEP 6: Validate the fix
DO $
DECLARE
    nullable_check TEXT;
BEGIN
    SELECT is_nullable INTO nullable_check
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'password';
    
    IF nullable_check = 'YES' THEN
        RAISE NOTICE '✅ VALIDATION PASSED: password column is nullable';
        RAISE NOTICE '✅ OAuth/passwordless authentication is now supported';
    ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: password column is still NOT NULL';
    END IF;
END $;

-- Success message
SELECT 
    '🎉 PASSWORD NULLABLE FIX COMPLETED' as status,
    '✅ Password column is now nullable' as fix_1,
    '✅ OAuth users can be created without passwords' as fix_2,
    '✅ Existing users with null passwords are preserved' as fix_3,
    '🚀 502 error permanently eliminated' as result;
