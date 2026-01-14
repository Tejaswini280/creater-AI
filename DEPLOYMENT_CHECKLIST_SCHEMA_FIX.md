# Deployment Checklist: Schema Validation Fix

## Pre-Deployment Verification

- [x] **Root cause identified**: Duplicate migration numbers
- [x] **Solution implemented**: Retired conflicting migrations
- [x] **Duplicates removed**: All migrations have unique numbers
- [x] **Validation script created**: verify-migration-numbers.ps1
- [x] **Deployment script created**: deploy-migration-duplicate-fix.ps1
- [x] **Documentation complete**: 7 comprehensive documents
- [x] **Local verification**: Validation script passes

## Deployment Steps

### Step 1: Final Verification (1 minute)

```powershell
# Run validation script
.\verify-migration-numbers.ps1
```

**Expected output**:
```
SUCCESS: No duplicate migration numbers found!
All migrations have unique numbers
Ready for deployment
```

- [ ] Validation script passes
- [ ] Shows 31 active migrations
- [ ] No duplicate numbers found

### Step 2: Deploy to Dev Branch (2 minutes)

```powershell
# Run deployment script
.\deploy-migration-duplicate-fix.ps1
```

**Expected actions**:
1. Verifies no duplicates
2. Stages changes
3. Commits with detailed message
4. Pushes to dev branch

- [ ] Deployment script completes successfully
- [ ] Changes committed to git
- [ ] Changes pushed to dev branch

### Step 3: Deploy to Railway (2 minutes)

```powershell
# Deploy to Railway
railway up
```

**Or use Railway CLI**:
```powershell
railway link
railway up
```

- [ ] Railway deployment triggered
- [ ] Build completes successfully
- [ ] Deployment starts

### Step 4: Monitor Deployment Logs (2 minutes)

Watch Railway logs for:

```
✅ Migration completed: 0001_core_tables_idempotent.sql
✅ Migration completed: 0002_add_missing_columns.sql
...
✅ Schema validation PASSED
🎉 MIGRATION PROCESS COMPLETED SUCCESSFULLY
```

- [ ] All migrations execute in order
- [ ] No migration errors
- [ ] Schema validation passes
- [ ] Application starts successfully

### Step 5: Verify Database Schema (1 minute)

```sql
-- Connect to Railway database
railway run psql $DATABASE_URL

-- Check projects table
\d projects

-- Verify name column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'name';
```

**Expected result**:
```
 column_name | data_type
-------------+-----------
 name        | character varying
```

- [ ] Projects table exists
- [ ] Name column exists
- [ ] Column type is VARCHAR

### Step 6: Verify Application Health (1 minute)

```powershell
# Check application endpoint
curl https://your-app.railway.app/health

# Or open in browser
start https://your-app.railway.app
```

- [ ] Application responds
- [ ] Health check passes
- [ ] No errors in browser console

## Post-Deployment Verification

### Database State

- [ ] All 31 migrations marked as completed
- [ ] Projects table exists with all columns
- [ ] Content table exists with all columns
- [ ] Users table exists with all columns
- [ ] No orphaned or incomplete tables

### Application State

- [ ] Application starts without errors
- [ ] Login page loads
- [ ] Dashboard loads
- [ ] Can create new project
- [ ] No console errors

### Migration State

- [ ] schema_migrations table has 31 entries
- [ ] All migrations have status 'completed'
- [ ] No migrations have status 'failed'
- [ ] Migration order is correct (0000-0030)

## Rollback Plan (If Needed)

### If Deployment Fails

```powershell
# Revert the commit
git reset --hard HEAD~1

# Force push to dev
git push origin dev --force

# Redeploy previous version
railway up
```

### If Database is Corrupted

```sql
-- Connect to database
railway run psql $DATABASE_URL

-- Drop and recreate schema (CAUTION: DATA LOSS)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restart application (migrations will run fresh)
```

### If Application Won't Start

1. Check Railway logs for specific error
2. Verify DATABASE_URL is set correctly
3. Check migration execution order
4. Verify no syntax errors in migrations

## Success Criteria

### Must Have (Critical)

- [x] No duplicate migration numbers
- [ ] Application starts successfully
- [ ] Schema validation passes
- [ ] Projects table exists with name column
- [ ] No errors in Railway logs

### Should Have (Important)

- [ ] All 31 migrations executed
- [ ] Database has all expected tables
- [ ] Application is accessible via URL
- [ ] Health check endpoint responds

### Nice to Have (Optional)

- [ ] Response time < 2 seconds
- [ ] No warnings in logs
- [ ] All features working correctly

## Timeline

| Step | Duration | Status |
|------|----------|--------|
| Pre-deployment verification | 1 min | ⏳ Pending |
| Deploy to dev branch | 2 min | ⏳ Pending |
| Deploy to Railway | 2 min | ⏳ Pending |
| Monitor deployment logs | 2 min | ⏳ Pending |
| Verify database schema | 1 min | ⏳ Pending |
| Verify application health | 1 min | ⏳ Pending |
| **Total** | **9 min** | ⏳ Pending |

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Deployment fails | Low | High | Rollback plan ready |
| Database corruption | Very Low | High | Backup available |
| Application won't start | Low | High | Previous version can be restored |
| Migration errors | Very Low | Medium | Idempotent migrations, safe to retry |

## Communication Plan

### Before Deployment

- [ ] Notify team of deployment
- [ ] Share expected downtime (0 minutes)
- [ ] Share monitoring dashboard link

### During Deployment

- [ ] Monitor Railway logs
- [ ] Watch for errors
- [ ] Be ready to rollback if needed

### After Deployment

- [ ] Confirm successful deployment
- [ ] Share verification results
- [ ] Update team on status

## Emergency Contacts

- **Database Issues**: Check SCHEMA_VALIDATION_FAILURE_ROOT_CAUSE_ANALYSIS.md
- **Deployment Issues**: Check DEPLOY_NOW.md
- **Quick Reference**: Check QUICK_FIX_SCHEMA_VALIDATION.md

## Final Checklist

Before marking as complete, verify:

- [ ] All pre-deployment checks passed
- [ ] All deployment steps completed
- [ ] All post-deployment verifications passed
- [ ] No errors or warnings
- [ ] Application is fully functional
- [ ] Team has been notified

## Sign-Off

- [ ] **Technical Lead**: Approved
- [ ] **Database Admin**: Verified
- [ ] **DevOps**: Deployed
- [ ] **QA**: Tested

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Verification By**: _____________  
**Status**: ⏳ READY FOR DEPLOYMENT

---

**Next Action**: Run `.\deploy-migration-duplicate-fix.ps1`
