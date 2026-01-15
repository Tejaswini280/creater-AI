-- Migration: Fix Login 500 Error - Password Column Name Mismatch
-- Created: 2025-01-15
-- Description: Rename password_hash to password and make it nullable for OAuth support
-- Root Cause: Database has password_hash column but schema expects password column
-- Impact: All login attempts were failing with 500 Internal Server Error

-- Step 1: Rename password_hash to password if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users RENAME COLUMN password_hash TO password;
        RAISE NOTICE 'Renamed password_hash to password';
    END IF;
END $$;

-- Step 2: Ensure password column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE 'Created password column';
    END IF;
END $$;

-- Step 3: Make password nullable to support OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
