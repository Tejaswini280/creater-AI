-- Migration: Add missing description column to content table
-- This fixes the "column description does not exist" error in the scheduler service
-- Root Cause: The description column was defined in schema but not properly added to production database

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Add description column to content table if it doesn't exist
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check and add description column
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS description TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Verify the column was added successfully
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add comment for documentation
COMMENT ON COLUMN content.description IS 'Content description for scheduled posts and content items';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Update any existing content with NULL description to empty string
-- ═══════════════════════════════════════════════════════════════════════════════

-- This ensures backward compatibility with existing records
UPDATE content 
SET description = '' 
WHERE description IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content' AND column_name = 'description';
