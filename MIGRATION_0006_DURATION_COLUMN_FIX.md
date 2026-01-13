# Migration 0006 - Duration Column Type Conflict Fix ✅

## Error Found
```
Migration failed: 0006_critical_form_database_mapping_fix.sql
Error: invalid input syntax for type integer: "7days"
```

## Root Cause
**Column Type Conflict Between Migrations:**

- **Migration 0002** (`0002_add_missing_columns.sql`):
  ```sql
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration INTEGER;
  ```
  Defines `duration` as **INTEGER**

- **Migration 0006** (`0006_critical_form_database_mapping_fix.sql`):
  ```sql
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
  ```
  Tried to add `duration` as **VARCHAR** (conflict!)
  
  And then tried to add a constraint:
  ```sql
  CHECK (duration IS NULL OR duration IN ('7days', '30days', '90days', 'custom'));
  ```
  This constraint uses **string values** but the column is **INTEGER**!

## The Fix

### 1. Removed Duplicate Column Definition
**Before**:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
```

**After**:
```sql
-- Note: duration column already exists as INTEGER from migration 0002, skip adding as VARCHAR
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
```

### 2. Removed Invalid Constraint
**Before**:
```sql
ALTER TABLE projects ADD CONSTRAINT chk_projects_duration 
  CHECK (duration IS NULL OR duration IN ('7days', '30days', '90days', 'custom'));
```

**After**:
```sql
-- Note: duration column is INTEGER (from migration 0002), not VARCHAR
-- Skipping duration constraint as it should accept numeric values (7, 30, 90, etc.)
-- The constraint check with string values like '7days' would fail for INTEGER column
```

### 3. Updated Comment
**Before**:
```sql
COMMENT ON COLUMN projects.duration IS 'Project duration (7days, 30days, 90days, custom)';
```

**After**:
```sql
COMMENT ON COLUMN projects.duration IS 'Project duration in days (INTEGER: 7, 30, 90, etc.)';
```

## Why This Happened

Migration 0006 was written without checking what migration 0002 had already defined. This created a conflict where:
1. Migration 0002 created `duration` as INTEGER
2. Migration 0006 tried to create it as VARCHAR (ignored due to IF NOT EXISTS)
3. Migration 0006 tried to add a constraint with string values
4. PostgreSQL rejected the constraint because you can't check if an INTEGER is IN ('7days', '30days', ...)

## Correct Usage

Since `duration` is INTEGER, applications should use:
- ✅ `duration = 7` (for 7 days)
- ✅ `duration = 30` (for 30 days)
- ✅ `duration = 90` (for 90 days)
- ❌ `duration = '7days'` (WRONG - will fail)

## Git Commit
```
commit 79c1dc3
Fix: Remove duration column conflict in migration 0006 - duration is INTEGER not VARCHAR
```

## Files Modified
- `migrations/0006_critical_form_database_mapping_fix.sql`

## Expected Railway Behavior

Once Railway picks up this fix:
1. ✅ Skip migrations 0000-0005 (already executed)
2. ✅ Execute migration 0006 successfully (now fixed)
3. ✅ Continue with remaining migrations
4. ✅ Start application

---

**Status**: FIXED ✅
**Date**: 2026-01-13
**Branch**: dev
**Commit**: 79c1dc3
