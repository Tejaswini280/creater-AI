-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0001 CLEAN - RETIRED (SUPERSEDED BY IDEMPOTENT VERSION)
-- ═══════════════════════════════════════════════════════════════════════════════
-- This legacy migration attempted to create core tables with UUID primary keys
-- and foreign key constraints, but conflicts with the modern idempotent version
-- This migration is now RETIRED to prevent schema conflicts
-- Date: 2026-01-12 (Retired for production safety)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- RETIREMENT NOTICE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    'Migration 0001 CLEAN RETIRED - Superseded by 0001_core_tables_idempotent.sql' as status,
    'This legacy migration is intentionally skipped for production safety' as reason,
    'Modern idempotent version handles all core table creation' as replacement,
    NOW() as retired_at;