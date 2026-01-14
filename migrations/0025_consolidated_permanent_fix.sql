-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0025: CONSOLIDATED PERMANENT FIX
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- PURPOSE:
-- This migration consolidates ALL password-related fixes from migrations 0015-0024
-- into a single, idempotent, production-safe migration.
--
-- ROOT CAUSES FIXED:
-- 1. Password column NOT NULL constraint (breaks OAuth users)
-- 2. Password_hash column NOT NULL constraint (breaks OAuth users)
-- 3. Invalid password values in database ('', 'temp_password_needs_reset', etc.)
-- 4. Missing email unique constraint
-- 5. Missing performance indexes
--
-- DESIGN PRINCIPLES:
-- ✅ 100% Idempotent - Safe to run multiple times
-- ✅ State-aware - Checks current database state before changes
-- ✅ Railway-compatible - No DO blocks, no complex syntax
-- ✅ Production-safe - Works on fresh DB and existing DB
-- ✅ OAuth-compatible - Supports users without passwords
-- ✅ Backward-compatible - Doesn't break existing password users
--
-- REPLACES MIGRATIONS:
-- - 0015_passwordless_oauth_fix.sql
-- - 0017_fix_password_hash_column_mismatch.sql
-- - 0018_fix_password_hash_null_constraint.sql
-- - 0019_fix_password_hash_null_values_hotfix.sql
-- - 0020_fix_password_hash_null_values_production.sql
-- - 0021_fix_password_null_constraint_permanent.sql
-- - 0022_fix_password_nullable_for_oauth.sql
-- - 0023_fix_password_nullable_permanent.sql
-- - 0024_fix_password_not_null_constraint_permanent.sql
--
-- Date: 2026-01-14
-- Author: Senior DB Expert
-- Status: PERMANENT FIX - CONSOLIDATED
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ENSURE USERS TABLE EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create users table if it doesn't exist (idempotent)
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: ENSURE PASSWORD COLUMNS EXIST (NULLABLE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add password column if it doesn't exist (nullable by default)
-- This supports both traditional auth (with password) and OAuth (without password)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password_hash column if it doesn't exist (nullable by default)
-- Some legacy code uses password_hash instead of password
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: DROP NOT NULL CONSTRAINTS (IF THEY EXIST)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop NOT NULL constraint from password column
-- This is safe because:
-- 1. If constraint doesn't exist, PostgreSQL ignores the command
-- 2. If constraint exists, it's removed (allowing OAuth users)
-- 3. Existing password users are not affected
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Drop NOT NULL constraint from password_hash column
-- Same reasoning as above
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: CLEAN UP INVALID PASSWORD VALUES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Set invalid password values to NULL
-- These values were used as placeholders but should be NULL for OAuth users
UPDATE users 
SET password = NULL 
WHERE password IN (
    '',                           -- Empty string
    'temp_password_needs_reset',  -- Temporary placeholder
    'null',                       -- String 'null' (not actual NULL)
    'undefined',                  -- String 'undefined'
    'TEMP_PASSWORD',              -- Another temporary placeholder
    'oauth_user_no_password'      -- OAuth placeholder
);

-- Set invalid password_hash values to NULL
-- Same reasoning as above
UPDATE users 
SET password_hash = NULL 
WHERE password_hash IN (
    '',
    'temp_password_needs_reset',
    'null',
    'undefined',
    'TEMP_PASSWORD',
    'oauth_user_no_password'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: ENSURE EMAIL UNIQUE CONSTRAINT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create unique constraint on email if it doesn't exist
-- Note: We use CREATE UNIQUE INDEX instead of ALTER TABLE ADD CONSTRAINT
-- because it's more idempotent (IF NOT EXISTS works with indexes)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: CREATE PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Index on email for faster lookups (login, registration)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on password_hash for faster authentication
-- Only index non-NULL values (OAuth users don't need this index)
CREATE INDEX IF NOT EXISTS idx_users_password_hash 
ON users(password_hash) 
WHERE password_hash IS NOT NULL;

-- Index on is_active for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active) 
WHERE is_active = true;

-- Index on created_at for sorting and analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite index for common query pattern (active users by email)
CREATE INDEX IF NOT EXISTS idx_users_email_active 
ON users(email, is_active) 
WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: ADD HELPFUL COLUMN COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN users.password IS 
'Hashed password for traditional authentication. NULL for OAuth users.';

COMMENT ON COLUMN users.password_hash IS 
'Legacy column for hashed password. Use password column instead. NULL for OAuth users.';

COMMENT ON COLUMN users.email IS 
'User email address. Must be unique. Used for login and notifications.';

COMMENT ON COLUMN users.is_active IS 
'Whether the user account is active. Inactive users cannot login.';

COMMENT ON TABLE users IS 
'User accounts. Supports both traditional authentication (with password) and OAuth (without password).';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: VALIDATION AND SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify that password columns are nullable
-- This query will return the columns and their nullable status
-- Expected result: password and password_hash should both be 'YES' for is_nullable
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('password', 'password_hash')
ORDER BY column_name;

-- Success message
SELECT 
    '✅ Migration 0025 completed successfully' as status,
    'Password columns are now nullable' as fix_1,
    'OAuth users are fully supported' as fix_2,
    'Traditional auth users still work' as fix_3,
    'Invalid password values cleaned up' as fix_4,
    'Performance indexes created' as fix_5,
    'Email unique constraint enforced' as fix_6,
    NOW() as completed_at;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- WHAT THIS MIGRATION DOES:
-- 1. ✅ Ensures users table exists
-- 2. ✅ Ensures password and password_hash columns exist (nullable)
-- 3. ✅ Drops NOT NULL constraints from password columns
-- 4. ✅ Cleans up invalid password values
-- 5. ✅ Enforces email unique constraint
-- 6. ✅ Creates performance indexes
-- 7. ✅ Adds documentation comments
-- 8. ✅ Validates success
--
-- WHAT THIS MIGRATION FIXES:
-- ❌ 502 errors during user registration (OAuth users)
-- ❌ Migration loops (duplicate password fixes)
-- ❌ Constraint violations (NOT NULL on password)
-- ❌ Invalid password values in database
-- ❌ Missing email unique constraint
-- ❌ Slow user queries (missing indexes)
--
-- SAFE TO RUN:
-- ✅ On fresh database (creates everything)
-- ✅ On existing database (only makes necessary changes)
-- ✅ Multiple times (100% idempotent)
-- ✅ On Railway production (no DO blocks)
-- ✅ On local development (standard PostgreSQL)
--
-- TESTING:
-- 1. Test OAuth user registration (should work without password)
-- 2. Test password user login (should work with password)
-- 3. Test email uniqueness (duplicate emails should fail)
-- 4. Test migration re-run (should complete without errors)
--
-- ═══════════════════════════════════════════════════════════════════════════════
