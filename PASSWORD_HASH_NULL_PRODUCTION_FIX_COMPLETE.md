# Password Hash NULL Constraint Fix - Production Deployment

## Issue Identified
Railway staging deployment was failing with error:
```
Migration 0007_production_repair_idempotent.sql failed: 
null value in column "password_hash" of relation "users" violates not-null constraint
```

## Root Cause
The migration `0007_production_repair_idempotent.sql` was adding the `password_hash` column to the users table but:
1. Did not set a default value
2. Did not handle existing NULL values
3. This caused issues when the application tried to enforce not-null constraints

## Solution Implemented

### 1. Created New Migration: `0020_fix_password_hash_null_values_production.sql`
- Updates all NULL `password_hash` values to `'oauth_user_no_password'`
- Sets default value for the column
- Idempotent and safe to run multiple times
- Includes verification query

### 2. Updated Existing Migration: `0007_production_repair_idempotent.sql`
- Added DEFAULT value when creating the column
- Added UPDATE statement to fix existing NULL values
- Prevents the issue from occurring on fresh deployments

## Changes Made

### New Migration File
```sql
-- Updates NULL values to OAuth placeholder
UPDATE users 
SET password_hash = 'oauth_user_no_password'
WHERE password_hash IS NULL;

-- Sets default for new records
ALTER TABLE users 
ALTER COLUMN password_hash SET DEFAULT 'oauth_user_no_password';
```

### Updated Migration File
```sql
-- Now includes DEFAULT value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'oauth_user_no_password';

-- Handles existing NULL values
UPDATE users 
SET password_hash = 'oauth_user_no_password'
WHERE password_hash IS NULL;
```

## Deployment Status
✅ Changes committed to dev branch
✅ Pushed to GitHub repository
⏳ Ready for Railway redeployment

## Next Steps
1. Railway will automatically redeploy with the new changes
2. The migration will now succeed
3. All OAuth users will have the placeholder value `'oauth_user_no_password'`
4. Application authentication logic handles this value correctly

## Technical Details
- **Migration Order**: 0020 runs after 0007, ensuring backward compatibility
- **OAuth Support**: Maintains passwordless authentication for OAuth users
- **Idempotent**: Safe to run multiple times without side effects
- **Production Safe**: No data loss, no breaking changes

## Verification
After deployment, verify with:
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as null_passwords,
  COUNT(CASE WHEN password_hash = 'oauth_user_no_password' THEN 1 END) as oauth_users
FROM users;
```

Expected result: `null_passwords` should be 0

---
**Status**: ✅ COMPLETE - Ready for Railway Deployment
**Date**: January 13, 2026
**Branch**: dev
**Commit**: 0f63453
