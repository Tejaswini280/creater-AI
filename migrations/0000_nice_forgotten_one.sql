-- ═══════════════════════════════════════════════════════════════════════════════
-- BASELINE MIGRATION - PRODUCTION SAFE INITIALIZATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- This migration establishes the baseline for the migration system
-- Safe to run on fresh DB and existing databases
-- Date: 2026-01-10
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the migration tracking table exists
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT NOW(),
    checksum VARCHAR,
    execution_time_ms INTEGER
);

-- This migration establishes the baseline and ensures extensions are available
SELECT 'Baseline migration completed successfully - Extensions enabled' as baseline_migration_complete;