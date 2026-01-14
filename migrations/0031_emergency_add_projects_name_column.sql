-- ═══════════════════════════════════════════════════════════════════════════════
-- EMERGENCY HOTFIX: Add missing projects.name column
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration adds the missing 'name' column to the projects table
-- Safe to run on existing databases - uses IF NOT EXISTS pattern
-- Date: 2026-01-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add the missing name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE projects ADD COLUMN name VARCHAR NOT NULL DEFAULT 'Untitled Project';
        
        -- Remove the default after adding the column
        ALTER TABLE projects ALTER COLUMN name DROP DEFAULT;
        
        RAISE NOTICE 'Added missing name column to projects table';
    ELSE
        RAISE NOTICE 'Column projects.name already exists, skipping';
    END IF;
END $$;

-- Verify the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'name'
    ) THEN
        RAISE NOTICE 'Verification passed: projects.name column exists';
    ELSE
        RAISE EXCEPTION 'CRITICAL: projects.name column still missing after migration';
    END IF;
END $$;

SELECT 'Emergency hotfix completed - projects.name column added' as status;
