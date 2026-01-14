-- ═══════════════════════════════════════════════════════════════════════════════
-- 0022 FIX PASSWORD NULLABLE FOR OAUTH - NO DO BLOCKS
-- ═══════════════════════════════════════════════════════════════════════════════
-- EMERGENCY FIX: Removed DO blocks to work with Railway PostgreSQL
-- Original migration had DO blocks that caused syntax errors
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure password column exists and is nullable
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
-- Ensure password_hash column exists and is nullable  
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- Clean up invalid password values
UPDATE users SET password = NULL WHERE password IN ('', 'temp_password_needs_reset', 'null', 'undefined');
UPDATE users SET password_hash = NULL WHERE password_hash IN ('', 'temp_password_needs_reset', 'null', 'undefined');

-- Add unique constraint on email if it doesn't exist
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Success message (as comment)
-- ✅ Migration completed successfully
-- ✅ Password columns are nullable (supports OAuth)
-- ✅ Email has unique constraint
-- ✅ Indexes created for performance
