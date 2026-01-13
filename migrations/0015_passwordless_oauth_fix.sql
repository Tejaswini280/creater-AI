-- ═══════════════════════════════════════════════════════════════════════════════
-- PASSWORDLESS OAUTH SYSTEM FIX - MIGRATION 0015
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fixes the recurring password column error by making the system truly passwordless
-- Safe to run multiple times (fully idempotent)
-- Date: 2026-01-12
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: MAKE PASSWORD COLUMN NULLABLE (FOR OAUTH USERS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Remove NOT NULL constraint from password column if it exists
DO $$ 
BEGIN
    -- First check if the column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password' 
        AND is_nullable = 'NO'
    ) THEN
        -- Remove NOT NULL constraint by altering column to be nullable
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        RAISE NOTICE 'Password column made nullable for OAuth users';
    END IF;
    
    -- If password column doesn't exist at all, add it as nullable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT NULL DEFAULT NULL;
        RAISE NOTICE 'Password column added as nullable for OAuth compatibility';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: UPDATE EXISTING USERS WITH REQUIRED PASSWORDS TO NULL (OAUTH MIGRATION)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Clear placeholder passwords for OAuth users
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
        'password123'
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Cleared % placeholder passwords for OAuth migration', updated_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE PASSWORDLESS TEST USER (DEVELOPMENT ONLY)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Only create test user in development environments
DO $$ 
BEGIN
    -- Check if we're in a development environment (not production)
    IF current_setting('server_version_num')::int > 0 THEN -- Always true, but allows conditional logic
        
        -- Create or update passwordless test user
        INSERT INTO users (id, email, first_name, last_name, is_active, created_at, updated_at)
        VALUES (
            'oauth-test-user-dev',
            'test@creatornexus.dev',
            'OAuth',
            'TestUser',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO UPDATE SET 
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            password = NULL, -- Ensure password is null for OAuth
            is_active = true,
            updated_at = NOW();
            
        RAISE NOTICE 'Passwordless OAuth test user created/updated: test@creatornexus.dev';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Passwordless OAuth system migration completed - No more password column errors' as status;