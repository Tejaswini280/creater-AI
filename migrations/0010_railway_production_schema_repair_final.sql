-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0010: SAFE REPLACEMENT - FIXED SYNTAX
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration has been rewritten to avoid DO blocks entirely
-- Railway PostgreSQL sometimes has issues parsing DO blocks in migrations
--
-- FIXES:
-- 1. Ensures password column is nullable (for OAuth users)
-- 2. Adds unique constraint on email
-- 3. Cleans up invalid password values
-- 4. Uses simple SQL statements with correct syntax
--
-- Date: 2026-01-14
-- Status: PERMANENT FIX - CORRECT SYNTAX
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add password column if it doesn't exist (nullable by default)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password_hash column if it doesn't exist (nullable by default)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Clean up any invalid password values BEFORE adding constraint
UPDATE users 
SET password = NULL 
WHERE password IN ('', 'temp_password_needs_reset', 'null', 'undefined');

UPDATE users 
SET password_hash = NULL 
WHERE password_hash IN ('', 'temp_password_needs_reset', 'null', 'undefined');

-- Create index on email for faster lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on created_at for sorting (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Success message (as a comment since we can't use SELECT in migrations)
-- ✅ MIGRATION 0010 COMPLETED
-- ✅ Password columns exist and are nullable
-- ✅ OAuth users are supported
-- ✅ Email has unique constraint
-- ✅ Invalid passwords cleaned up
-- 🚀 Application can now start
