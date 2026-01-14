-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Add Missing Description Column to Content Table
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Root Cause: The description column is missing from the content table in production
-- Error: PostgresError: column "description" does not exist (code: 42703)
-- 
-- This script safely adds the missing column and updates existing records
-- Safe to run multiple times (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Add the missing description column
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add documentation comment
COMMENT ON COLUMN content.description IS 'Content description for scheduled posts and content items';

-- Step 3: Update existing NULL values to empty strings for backward compatibility
UPDATE content 
SET description = '' 
WHERE description IS NULL;

-- Step 4: Verification - Check the column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'content' 
AND column_name = 'description';

-- Step 5: Count affected rows
SELECT 
    COUNT(*) as total_content_rows,
    COUNT(description) as rows_with_description,
    COUNT(*) - COUNT(description) as rows_with_null_description
FROM content;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Expected Output:
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Verification Query Result:
--  column_name | data_type | is_nullable | column_default 
-- -------------+-----------+-------------+----------------
--  description | text      | YES         | 
-- 
-- This confirms the column was added successfully
-- ═══════════════════════════════════════════════════════════════════════════════
