# Migration 0007 - User ID Type Conversion Fix

## Status: ✅ FIXED

## Error
```
invalid input syntax for type integer: "test-user-repair-oauth"
```

## Root Cause
Migration 0007 was trying to insert a VARCHAR user id (`'test-user-repair-oauth'`) into the users table, but the table may have been created in a previous migration with `id INTEGER` instead of `id VARCHAR`.

The `CREATE TABLE IF NOT EXISTS` statement in migration 0007 would skip table creation if it already existed, leaving the INTEGER type in place, causing the INSERT to fail.

## Fix Applied

Added type conversion logic to migration 0007 before the INSERT statement:

```sql
-- FIX: Ensure id column is VARCHAR type (handles INTEGER to VARCHAR conversion)
-- Step 1: Drop and recreate primary key to allow type change
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

-- Step 2: Change column type - converts INTEGER to VARCHAR if needed
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR USING id::VARCHAR;

-- Step 3: Recreate primary key
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
```

## Why This Works

1. **Drops primary key constraint** - Required to allow column type change
2. **Converts column type** - `USING id::VARCHAR` converts existing INTEGER values to VARCHAR strings
3. **Recreates primary key** - Restores the constraint after type change
4. **Safe to run multiple times** - If already VARCHAR, the conversion is a no-op
5. **No DO blocks** - Uses standard SQL per project standards

## Files Modified
- `migrations/0007_production_repair_idempotent.sql`

## Git Commit
- Commit: 5949d6b
- Branch: dev

## Next Steps
1. Push to dev branch
2. Railway will automatically deploy and run migrations
3. Verify deployment succeeds

## Related Issues
- Migration 0004: Fixed `popularity_score` → `trend_score` column mismatch
- Migration 0004: Fixed niches table NOT NULL constraint violations
- Migration 0006: Fixed duration column type conflict (INTEGER vs VARCHAR)
- Migration 0007: Fixed users.id type mismatch (INTEGER vs VARCHAR) ← **CURRENT**
