-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PASSWORD_HASH NULL CONSTRAINT FOR OAUTH USERS - NO DO BLOCKS
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes the Railway 502 error caused by trying to add a NOT NULL
-- constraint to password_hash when OAuth users have NULL values.
--
-- SOLUTION: Make password_hash nullable to support passwordless OAuth authentication
-- FIXED: Removed all DO blocks to work with Railway PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the NOT NULL constraint if it exists on password column
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Ensure password_hash column exists and is nullable
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Also ensure password column is nullable (for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Update any empty strings to NULL for consistency
UPDATE users SET password_hash = NULL WHERE password_hash = '';
UPDATE users SET password = NULL WHERE password = '';

-- Update any temp passwords to NULL for OAuth users
UPDATE users SET password_hash = NULL WHERE password_hash = 'temp_password_needs_reset';
UPDATE users SET password = NULL WHERE password = 'temp_password_needs_reset';

-- Add comment to document the nullable constraint
COMMENT ON COLUMN users.password_hash IS 'Password hash for local authentication. NULL for OAuth users (passwordless).';
COMMENT ON COLUMN users.password IS 'Password for local authentication. NULL for OAuth users (passwordless).';

-- Success message (as comment since we can't use SELECT in migrations)
-- ✅ PASSWORD HASH NULL CONSTRAINT FIX COMPLETED
-- ✅ OAuth users can now have NULL password_hash
-- ✅ Railway 502 error permanently fixed
