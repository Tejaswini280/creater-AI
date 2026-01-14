-- Migration: Fix Scheduler Schema Permanently
-- Description: Ensures all required columns exist for the scheduler service
-- Date: 2025-01-14
-- Issue: Scheduler fails with "column content_type does not exist" error

-- ============================================================================
-- PART 1: Ensure all required columns exist in content table
-- ============================================================================

-- Add content_type if missing (critical for scheduler)
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_type VARCHAR;

-- Add other scheduler-required columns if missing
ALTER TABLE content ADD COLUMN IF NOT EXISTS script TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS platform VARCHAR;
ALTER TABLE content ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'draft';
ALTER TABLE content ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
ALTER TABLE content ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE content ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR;
ALTER TABLE content ADD COLUMN IF NOT EXISTS video_url VARCHAR;
ALTER TABLE content ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE content ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add enhanced project workflow columns
ALTER TABLE content ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true;
ALTER TABLE content ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;
ALTER TABLE content ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- ============================================================================
-- PART 2: Set default values for existing NULL content_type rows
-- ============================================================================

-- Update any NULL content_type values to 'video' (safe default)
UPDATE content
SET content_type = 'video'
WHERE content_type IS NULL;

-- Update any NULL platform values to 'youtube' (safe default)
UPDATE content
SET platform = 'youtube'
WHERE platform IS NULL;

-- Update any NULL status values to 'draft' (safe default)
UPDATE content
SET status = 'draft'
WHERE status IS NULL;

-- ============================================================================
-- PART 3: Add NOT NULL constraints after data cleanup
-- ============================================================================

-- Make content_type NOT NULL (after setting defaults)
ALTER TABLE content ALTER COLUMN content_type SET NOT NULL;

-- Make platform NOT NULL (after setting defaults)
ALTER TABLE content ALTER COLUMN platform SET NOT NULL;

-- Make status NOT NULL (after setting defaults)
ALTER TABLE content ALTER COLUMN status SET NOT NULL;

-- ============================================================================
-- PART 4: Create performance indexes for scheduler queries
-- ============================================================================

-- Index for scheduler status queries
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);

-- Index for scheduled content queries
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at) 
WHERE scheduled_at IS NOT NULL;

-- Index for user content queries
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);

-- Index for project content queries
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) 
WHERE project_id IS NOT NULL;

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_content_platform ON content(platform);

-- Index for content type filtering
CREATE INDEX IF NOT EXISTS idx_content_content_type ON content(content_type);

-- Composite index for scheduler's main query
CREATE INDEX IF NOT EXISTS idx_content_scheduler_query 
ON content(status, scheduled_at) 
WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- ============================================================================
-- PART 5: Add helpful column comments
-- ============================================================================

COMMENT ON COLUMN content.content_type IS 'Type of content: video, image, text, reel, short';
COMMENT ON COLUMN content.status IS 'Content status: draft, scheduled, published, failed, paused, stopped';
COMMENT ON COLUMN content.scheduled_at IS 'When the content is scheduled to be published';
COMMENT ON COLUMN content.day_number IS 'Day number in the project timeline (1, 2, 3, etc.)';
COMMENT ON COLUMN content.is_paused IS 'Whether this content is paused';
COMMENT ON COLUMN content.is_stopped IS 'Whether this content is stopped';
COMMENT ON COLUMN content.can_publish IS 'Whether this content can be published';

-- ============================================================================
-- PART 6: Verify schema integrity
-- ============================================================================

-- This will fail if any required columns are missing, preventing deployment
DO $$
DECLARE
  missing_columns TEXT[];
  required_cols TEXT[] := ARRAY[
    'id', 'user_id', 'title', 'description', 'script', 
    'platform', 'content_type', 'status', 'scheduled_at',
    'created_at', 'updated_at'
  ];
  col TEXT;
BEGIN
  -- Check for missing columns
  FOREACH col IN ARRAY required_cols
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'content' 
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  -- Raise error if any columns are missing
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Missing required columns in content table: %', 
      array_to_string(missing_columns, ', ');
  END IF;
  
  RAISE NOTICE 'Schema verification passed: All required columns exist';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
