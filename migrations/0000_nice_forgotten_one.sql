-- ═══════════════════════════════════════════════════════════════════════════════
-- BASELINE MIGRATION - NO-OP FOR EXISTING DATABASES
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration serves as a baseline and does nothing.
-- It will never fail on existing databases.
-- All real schema creation is handled in 9999_production_repair_idempotent.sql
-- Date: 2026-01-09
-- ═══════════════════════════════════════════════════════════════════════════════

-- This is a NO-OP migration that establishes the baseline
-- It does nothing and will never fail on existing databases
SELECT 1 as baseline_migration_complete;