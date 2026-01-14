-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PASSWORD HASH COLUMN MISMATCH - MIGRATION 0017
-- ═══════════════════════════════════════════════════════════════════════════════
-- Resolves the password_hash vs password column mismatch causing 502 errors
-- Makes the system fully OAuth compatible with nullable password column
-- Safe to run multiple times (fully idempotent)
-- Date: 2026-01-13
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: STANDARDIZE ON PASSWORD COLUMN (OAUTH COMPATIBLE)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    has_password_hash BOOLEAN := FALSE;
    has_password BOOLEAN := FALSE;
BEGIN
    -- Check if password_hash column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) INTO has_password_hash;
    
    -- Check if password column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) INTO has_password;
    
    RAISE NOTICE 'Schema check: password_hash=%, password=%', has_password_hash, has_password;
    
    -- Case 1: Only password_hash exists - rename it to password
    IF has_password_hash AND NOT has_password THEN
        ALTER TABLE users RENAME COLUMN password_hash TO password;
        RAISE NOTICE 'Renamed password_hash column to password';
    END IF;
    
    -- Case 2: Both exist - drop password_hash, keep password
    IF has_password_hash AND has_password THEN
        ALTER TABLE users DROP COLUMN password_hash;
        RAISE NOTICE 'Dropped duplicate password_hash column, kept password';
    END IF;
    
    -- Case 3: Neither exists - create password column as nullable
    IF NOT has_password_hash AND NOT has_password THEN
        ALTER TABLE users ADD COLUMN password TEXT NULL DEFAULT NULL;
        RAISE NOTICE 'Created password column as nullable for OAuth';
    END IF;
    
    -- Ensure password column is nullable (for OAuth users)
    BEGIN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE 'Made password column nullable for OAuth compatibility';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Password column already nullable or error: %', SQLERRM;
    END;
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CLEAR PLACEHOLDER PASSWORDS FOR OAUTH USERS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE users 
    SET password = NULL 
    WHERE password IN (
        'temp_password_needs_reset',
        '$2b$10$rQZ8qNqZ8qNqZ8qNqZ8qNOe',
        'hashed_password_placeholder',
        'test_password',
        'password123',
        'dummy_password'
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Cleared % placeholder passwords for OAuth migration', updated_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE OAUTH TEST USER (SAFE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create or update OAuth test user with explicit NULL password (only if users table has required columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        -- Only insert if user doesn't exist (avoid id constraint violation)
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test-oauth@railway.app') THEN
            INSERT INTO users (id, email, first_name, last_name, profile_image_url, password, is_active) 
            VALUES (
                'oauth-test-user-' || gen_random_uuid()::text,
                'test-oauth@railway.app', 
                'OAuth', 
                'Test', 
                'https://via.placeholder.com/150', 
                NULL,
                true
            );
        ELSE
            UPDATE users SET
                first_name = 'OAuth',
                last_name = 'Test',
                profile_image_url = 'https://via.placeholder.com/150',
                password = NULL,
                is_active = true,
                updated_at = NOW()
            WHERE email = 'test-oauth@railway.app';
        END IF;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: VERIFY SCHEMA IS CORRECT
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    password_nullable BOOLEAN;
    password_exists BOOLEAN;
    password_hash_exists BOOLEAN;
BEGIN
    -- Check final schema state
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) INTO password_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) INTO password_hash_exists;
    
    SELECT is_nullable = 'YES' FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password'
    INTO password_nullable;
    
    -- Report final state
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'FINAL SCHEMA STATE:';
    RAISE NOTICE '✅ password column exists: %', password_exists;
    RAISE NOTICE '✅ password column nullable: %', password_nullable;
    RAISE NOTICE '✅ password_hash column removed: %', NOT password_hash_exists;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
    IF password_exists AND password_nullable AND NOT password_hash_exists THEN
        RAISE NOTICE '🎉 Schema fix complete - OAuth system ready!';
    ELSE
        RAISE WARNING '⚠️  Schema may still have issues - check manually';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Password hash column mismatch fixed - OAuth system ready' as status;
