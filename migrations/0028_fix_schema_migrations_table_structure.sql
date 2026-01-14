-- ═══════════════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: Repair schema_migrations Table Structure
-- ═══════════════════════════════════════════════════════════════════════════════
-- ROOT CAUSE: The schema_migrations table was created with an incomplete schema
-- missing the 'status' and 'error_message' columns that the migration runners
-- expect. This causes ALL migration tracking queries to fail, resulting in:
-- 1. Migrations being incorrectly marked as "skipped"
-- 2. No actual migrations being executed
-- 3. Empty database with no tables
-- 4. False positive "tables created/verified" messages
-- 5. Application failures due to missing schema
--
-- This migration is IDEMPOTENT and safe to run multiple times.
-- Date: 2026-01-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: ADD MISSING COLUMNS TO schema_migrations TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add status column (tracks whether migration completed, failed, or is running)
ALTER TABLE schema_migrations 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'completed';

-- Add error_message column (stores error details for failed migrations)
ALTER TABLE schema_migrations 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: UPDATE EXISTING RECORDS (if any)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Set status to 'completed' for all existing records that don't have a status
UPDATE schema_migrations 
SET status = 'completed' 
WHERE status IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: ADD CONSTRAINTS AND INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);

-- Create index on executed_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ADD DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN schema_migrations.status IS 'Migration execution status: completed, failed, or running';
COMMENT ON COLUMN schema_migrations.error_message IS 'Error message if migration failed';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: VERIFY STRUCTURE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  missing_columns TEXT[];
  required_columns TEXT[] := ARRAY['id', 'filename', 'executed_at', 'checksum', 'execution_time_ms', 'status', 'error_message'];
  col TEXT;
BEGIN
  -- Check each required column
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations' 
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  -- Raise error if any columns are missing
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'FATAL: schema_migrations table is missing required columns: %', 
      array_to_string(missing_columns, ', ');
  END IF;
  
  -- Success message
  RAISE NOTICE 'SUCCESS: All % required columns verified in schema_migrations table', 
    array_length(required_columns, 1);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    'schema_migrations table structure fixed' as status,
    'Added status and error_message columns' as changes,
    'Migration tracking will now work correctly' as impact,
    NOW() as completed_at;
