-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD MISSING CONTENT_METRICS.CREATED_AT COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration adds the genuinely missing created_at column to content_metrics
-- Identified during root cause analysis of schema validation failures
-- Date: 2026-01-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content_metrics' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE content_metrics 
    ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    
    -- Update existing rows to have a created_at value
    UPDATE content_metrics 
    SET created_at = NOW() 
    WHERE created_at IS NULL;
    
    RAISE NOTICE 'Added created_at column to content_metrics table';
  ELSE
    RAISE NOTICE 'Column content_metrics.created_at already exists, skipping';
  END IF;
END $$;

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content_metrics' 
    AND column_name = 'created_at'
  ) THEN
    RAISE NOTICE '✅ Verification passed: content_metrics.created_at exists';
  ELSE
    RAISE EXCEPTION '❌ Verification failed: content_metrics.created_at does not exist';
  END IF;
END $$;
