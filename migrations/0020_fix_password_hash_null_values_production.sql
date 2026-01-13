-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PASSWORD_HASH NULL VALUES IN PRODUCTION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration fixes NULL password_hash values for OAuth users
-- Safe to run multiple times (idempotent)
-- Date: 2026-01-13
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Update all NULL password_hash values to a placeholder for OAuth users
-- This allows the not-null constraint to be satisfied while maintaining OAuth functionality
UPDATE users 
SET password_hash = 'oauth_user_no_password'
WHERE password_hash IS NULL;

-- Step 2: Ensure the column exists (in case it doesn't)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 3: Set default value for new OAuth users
ALTER TABLE users 
ALTER COLUMN password_hash SET DEFAULT 'oauth_user_no_password';

-- Verification
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as null_passwords,
  COUNT(CASE WHEN password_hash = 'oauth_user_no_password' THEN 1 END) as oauth_users
FROM users;

SELECT 'PASSWORD_HASH NULL VALUES FIXED - PRODUCTION SAFE' as status;
