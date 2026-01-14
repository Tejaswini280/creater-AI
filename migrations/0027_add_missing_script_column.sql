-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMANENT FIX: Add Missing Script Column to Content Table
-- ═══════════════════════════════════════════════════════════════════════════════
-- ROOT CAUSE: Migration 0012 created content table with script column, but
-- the column is missing in production. This indicates either:
-- 1. Migration 0012 never ran in production
-- 2. Migration 0012 ran but failed silently
-- 3. Column was dropped by a subsequent migration
-- 4. Database was restored from backup without script column
--
-- This migration is IDEMPOTENT and safe to run multiple times.
-- It will add the script column ONLY if it doesn't exist.
-- Date: 2026-01-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: VERIFY CONTENT TABLE EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content'
  ) THEN
    RAISE EXCEPTION 'FATAL: content table does not exist. Run migration 0012 first.';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ADD SCRIPT COLUMN IF IT DOESN'T EXIST
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add script column to content table (idempotent - safe to run multiple times)
ALTER TABLE content ADD COLUMN IF NOT EXISTS script TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: VERIFY COLUMN WAS ADDED SUCCESSFULLY
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content' 
    AND column_name = 'script'
  ) THEN
    RAISE EXCEPTION 'FATAL: Failed to add script column to content table';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: ADD INDEX FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create index for script column searches (only if script is not null)
CREATE INDEX IF NOT EXISTS idx_content_script_exists ON content(id) WHERE script IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: ADD DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN content.script IS 'Content script/text for the content piece. Required by scheduler service.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: COMPREHENSIVE VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify all columns required by scheduler service exist
DO $$
DECLARE
  missing_columns TEXT[];
  required_columns TEXT[] := ARRAY[
    'id', 'user_id', 'title', 'description', 'script', 
    'platform', 'status', 'scheduled_at', 'created_at', 'updated_at'
  ];
  col TEXT;
BEGIN
  -- Check each required column
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'content' 
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  -- Raise error if any columns are missing
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'FATAL: Content table is missing required columns: %', 
      array_to_string(missing_columns, ', ');
  END IF;
  
  -- Success message
  RAISE NOTICE 'SUCCESS: All % required columns verified in content table', 
    array_length(required_columns, 1);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    'Script column fix completed successfully' as status,
    'Content table now has script column' as result,
    'Scheduler service can now initialize without errors' as impact,
    NOW() as completed_at;
