# Quick Fix: Schema Validation Failure (projects.name missing)

## Problem
```
❌ Schema validation FAILED:
Missing columns:
- projects.name
```

## Root Cause
**Duplicate migration numbers** causing wrong execution order.

## Solution (Already Applied)

### Files Changed
```
migrations/0001_core_tables_clean.sql → 0001_core_tables_clean.sql.retired
migrations/0003_essential_tables.sql → 0003_essential_tables.sql.retired
migrations/0004_seed_essential_data.sql → 0016_seed_essential_data.sql
```

### Verify Fix
```powershell
# Check for duplicates
.\verify-migration-numbers.ps1

# Expected: SUCCESS - No duplicates found
```

## Deploy to Production

### Option 1: Automated Deployment
```powershell
# Run deployment script
.\deploy-migration-duplicate-fix.ps1

# This will:
# 1. Verify no duplicates
# 2. Commit changes
# 3. Push to dev branch
```

### Option 2: Manual Deployment
```powershell
# Stage changes
git add migrations/
git add *.md
git add *.ps1

# Commit
git commit -m "fix(migrations): resolve duplicate migration numbers"

# Push
git push origin dev

# Deploy to Railway
railway up
```

## Verification

### Check Locally
```powershell
npm run dev
```

Look for:
- ✅ Migration completed: 0001_core_tables_idempotent.sql
- ✅ Schema validation PASSED
- ✅ Application starts successfully

### Check Database
```sql
psql $DATABASE_URL -c "\d projects"
```

Should show `name` column exists.

## If Still Failing

### Reset Database (CAUTION: Data Loss)
```sql
-- Connect to database
psql $DATABASE_URL

-- Drop and recreate schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restart application (migrations will run fresh)
```

### Check Migration Order
```powershell
# List migrations in execution order
Get-ChildItem migrations -Filter "*.sql" | 
  Where-Object { $_.Name -notlike "*.retired*" } | 
  Sort-Object Name | 
  Select-Object Name
```

First migration should be: `0001_core_tables_idempotent.sql`

## Prevention

### Before Creating New Migrations

1. **Check existing numbers**:
   ```powershell
   Get-ChildItem migrations -Filter "*.sql" | 
     Where-Object { $_.Name -notlike "*.retired*" } | 
     Sort-Object Name -Descending | 
     Select-Object -First 1 Name
   ```

2. **Use next available number**:
   - Last migration: `0030_establish_true_baseline.sql`
   - Next migration: `0031_your_new_migration.sql`

3. **Verify before committing**:
   ```powershell
   .\verify-migration-numbers.ps1
   ```

### Migration Naming Rules

✅ **CORRECT**:
- `0031_add_new_feature.sql`
- `0032_fix_column_type.sql`

❌ **WRONG**:
- `0031_add_feature.sql` and `0031_fix_bug.sql` (duplicate!)
- `31_add_feature.sql` (not zero-padded)
- `add_feature.sql` (no number)

## Quick Reference

| Command | Purpose |
|---------|---------|
| `.\verify-migration-numbers.ps1` | Check for duplicates |
| `.\deploy-migration-duplicate-fix.ps1` | Deploy fix |
| `npm run dev` | Test locally |
| `railway up` | Deploy to Railway |
| `psql $DATABASE_URL -c "\d projects"` | Verify schema |

## Status

✅ **FIX APPLIED** - Ready for deployment  
✅ **VERIFIED** - No duplicate migration numbers  
✅ **TESTED** - Migration order correct  

## Need Help?

See detailed documentation:
- [SCHEMA_VALIDATION_FAILURE_ROOT_CAUSE_ANALYSIS.md](./SCHEMA_VALIDATION_FAILURE_ROOT_CAUSE_ANALYSIS.md)
- [MIGRATION_DUPLICATE_NUMBER_FIX_COMPLETE.md](./MIGRATION_DUPLICATE_NUMBER_FIX_COMPLETE.md)
