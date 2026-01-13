-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PASSWORD COLUMN TO BE NULLABLE FOR OAUTH USERS
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes the root cause of "null value in column password violates
-- not-null constraint" error by ensuring the password column is nullable.
--
-- ROOT CAUSE:
-- - Previous migrations added NOT NULL constraint to password column
-- - OAuth users don't have passwords (they authenticate via OAuth providers)
-- - Migration 0010 tries to INSERT OAuth users without passwords
-- - This causes constraint violation and migration failure
--
-- SOLUTION:
-- - Remove NOT NULL constraint from password column
-- - Allow NULL values for OAuth users
-- - Keep password_hash column for traditional auth users
--
-- Date: 2026-01-13
-- Target: Railway Production Database
-- Purpose: Fix OAuth user creation and migration failures
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Ensure password column exists and is nullable
DO $$ 
BEGIN
    -- Add password column if it doesn't exist (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE 'Added password column to users table';
    END IF;
    
    -- Remove NOT NULL constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE 'Removed NOT NULL constraint from password column';
    END IF;
END $$;

-- Step 2: Ensure password_hash column exists and is nullable (for bcrypt hashes)
DO $$ 
BEGIN
    -- Add password_hash column if it doesn't exist (nullable for OAuth users)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Added password_hash column to users table';
    END IF;
    
    -- Remove NOT NULL constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        RAISE NOTICE 'Removed NOT NULL constraint from password_hash column';
    END IF;
END $$;

-- Step 3: Clean up any invalid password values
UPDATE users 
SET password = NULL 
WHERE password = '' OR password = 'temp_password_needs_reset';

UPDATE users 
SET password_hash = NULL 
WHERE password_hash = '' OR password_hash = 'temp_password_needs_reset';

-- Step 4: Verify the fix
DO $$ 
DECLARE
    password_nullable BOOLEAN;
    password_hash_nullable BOOLEAN;
    total_users INTEGER;
    null_password_users INTEGER;
BEGIN
    -- Check if password column is nullable
    SELECT is_nullable = 'YES' INTO password_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password';
    
    -- Check if password_hash column is nullable
    SELECT is_nullable = 'YES' INTO password_hash_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash';
    
    -- Count users
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO null_password_users FROM users WHERE password IS NULL AND password_hash IS NULL;
    
    -- Report status
    RAISE NOTICE '✅ Password column nullable: %', password_nullable;
    RAISE NOTICE '✅ Password_hash column nullable: %', password_hash_nullable;
    RAISE NOTICE '📊 Total users: %', total_users;
    RAISE NOTICE '📊 OAuth users (NULL password): %', null_password_users;
    
    IF password_nullable AND password_hash_nullable THEN
        RAISE NOTICE '✅ Migration successful - OAuth users can now be created';
    ELSE
        RAISE EXCEPTION 'Migration failed - password columns still have NOT NULL constraints';
    END IF;
END $$;
