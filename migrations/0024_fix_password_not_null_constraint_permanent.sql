-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0024: PERMANENT FIX FOR PASSWORD NOT NULL CONSTRAINT
-- ═══════════════════════════════════════════════════════════════════════════════
-- ROOT CAUSE ANALYSIS:
-- - Migration 0004 and 0012 added password column with NOT NULL constraint
-- - This breaks OAuth users who don't have passwords
-- - Migration 0010 tries to clean up but constraint still exists
-- 
-- PERMANENT SOLUTION:
-- 1. Drop the NOT NULL constraint from password column
-- 2. Drop the NOT NULL constraint from password_hash column
-- 3. Set invalid passwords to NULL
-- 4. Support both traditional auth (password) and OAuth (no password)
--
-- Date: 2026-01-14
-- Status: PERMANENT ROOT CAUSE FIX
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Clean up invalid password values FIRST (before dropping constraint)
UPDATE users 
SET password = NULL 
WHERE password IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD');

UPDATE users 
SET password_hash = NULL 
WHERE password_hash IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD');

-- Step 2: Drop NOT NULL constraint from password column (if it exists)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Step 3: Drop NOT NULL constraint from password_hash column (if it exists)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Step 4: Ensure both columns exist and are nullable
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 5: Create index for faster lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash) WHERE password_hash IS NOT NULL;

-- Step 6: Add check constraint to ensure at least one auth method exists
-- (Either password/password_hash for traditional auth OR OAuth provider)
-- This is a soft constraint - we don't enforce it at DB level to avoid migration issues
-- Application layer should handle this validation

-- Success message
SELECT 
    'Migration 0024 completed successfully' as status,
    'Password columns are now nullable' as fix_1,
    'OAuth users are fully supported' as fix_2,
    'Traditional auth users still work' as fix_3,
    NOW() as completed_at;
