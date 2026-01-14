-- ═══════════════════════════════════════════════════════════════════════════════
-- EMERGENCY SCHEMA DRIFT FIX FOR RAILWAY
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script fixes schema drift by adding missing columns to existing tables
-- Safe to run multiple times - uses IF NOT EXISTS checks
-- Date: 2026-01-14
-- ═══════════════════════════════════════════════════════════════════════════════

\echo '🔧 Starting emergency schema drift repair...'

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX 1: Add missing projects.name column
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    \echo '📋 Checking projects.name column...'
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'name'
    ) THEN
        \echo '✅ Adding projects.name column...'
        ALTER TABLE projects ADD COLUMN name VARCHAR NOT NULL DEFAULT 'Untitled Project';
        ALTER TABLE projects ALTER COLUMN name DROP DEFAULT;
        RAISE NOTICE 'Added missing name column to projects table';
    ELSE
        RAISE NOTICE 'Column projects.name already exists';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX 2: Verify all critical columns exist
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    \echo '🔍 Verifying critical columns...'
    
    -- Check projects.name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'name'
    ) THEN
        missing_columns := missing_columns || 'projects.name, ';
    END IF;
    
    -- Check projects.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'projects.user_id, ';
    END IF;
    
    -- Check projects.created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'created_at'
    ) THEN
        missing_columns := missing_columns || 'projects.created_at, ';
    END IF;
    
    IF missing_columns != '' THEN
        RAISE EXCEPTION 'CRITICAL: Missing columns: %', missing_columns;
    ELSE
        RAISE NOTICE '✅ All critical columns verified';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

\echo '📊 Final verification...'

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
AND column_name IN ('id', 'user_id', 'name', 'created_at')
ORDER BY column_name;

\echo '✅ Emergency schema drift repair completed!'
