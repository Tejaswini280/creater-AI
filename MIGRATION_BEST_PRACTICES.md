# 📚 DATABASE MIGRATION BEST PRACTICES

## Table of Contents
1. [Core Principles](#core-principles)
2. [Migration Structure](#migration-structure)
3. [Common Pitfalls](#common-pitfalls)
4. [Testing Strategy](#testing-strategy)
5. [Rollback Strategy](#rollback-strategy)
6. [Production Deployment](#production-deployment)

---

## Core Principles

### 1. Idempotency
**Every migration must be safe to run multiple times.**

❌ **Bad:**
```sql
ALTER TABLE users ADD COLUMN password TEXT NOT NULL;
```

✅ **Good:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
```

### 2. State Awareness
**Check current database state before making changes.**

❌ **Bad:**
```sql
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

✅ **Good:**
```sql
-- Check if constraint exists first
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password';

-- Then drop if needed
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### 3. Railway Compatibility
**Avoid DO blocks and complex syntax.**

❌ **Bad:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns ...) THEN
    ALTER TABLE users ADD COLUMN password TEXT;
  END IF;
END $$;
```

✅ **Good:**
```sql
-- Use simple SQL with IF NOT EXISTS
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
```

### 4. Backward Compatibility
**Don't break existing functionality.**

❌ **Bad:**
```sql
-- Removes column that existing code depends on
ALTER TABLE users DROP COLUMN password;
```

✅ **Good:**
```sql
-- Deprecate first, remove later
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- Keep password column for backward compatibility
-- Remove in future migration after code is updated
```

### 5. Transaction Safety
**Use transactions for atomic operations.**

✅ **Good:**
```sql
BEGIN;

-- Multiple related changes
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);

COMMIT;
```

---

## Migration Structure

### File Naming Convention
```
XXXX_descriptive_name.sql
```

- `XXXX` = Sequential number (0001, 0002, etc.)
- `descriptive_name` = Clear description of what the migration does
- `.sql` = SQL file extension

### Migration Template

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION XXXX: DESCRIPTIVE TITLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- PURPOSE:
-- Clear description of what this migration does and why
--
-- CHANGES:
-- 1. First change
-- 2. Second change
-- 3. Third change
--
-- DEPENDENCIES:
-- - Migration 0001 (users table)
-- - Migration 0002 (projects table)
--
-- SAFE TO RUN:
-- ✅ On fresh database
-- ✅ On existing database
-- ✅ Multiple times (idempotent)
--
-- Date: YYYY-MM-DD
-- Author: Your Name
-- ═══════════════════════════════════════════════════════════════════════════════

-- Section 1: Create tables
CREATE TABLE IF NOT EXISTS example_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Section 2: Add columns
ALTER TABLE example_table ADD COLUMN IF NOT EXISTS description TEXT;

-- Section 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_example_name ON example_table(name);

-- Section 4: Validation
SELECT 'Migration XXXX completed successfully' as status;
```

---

## Common Pitfalls

### Pitfall 1: NOT NULL Constraints on Existing Tables

❌ **Problem:**
```sql
ALTER TABLE users ADD COLUMN password TEXT NOT NULL;
-- Fails if table has existing rows!
```

✅ **Solution:**
```sql
-- Add column as nullable first
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Set default values for existing rows
UPDATE users SET password = 'temp_password' WHERE password IS NULL;

-- Then add NOT NULL constraint (if really needed)
ALTER TABLE users ALTER COLUMN password SET NOT NULL;
```

### Pitfall 2: Foreign Key Constraints on Existing Data

❌ **Problem:**
```sql
ALTER TABLE content ADD CONSTRAINT fk_content_user
FOREIGN KEY (user_id) REFERENCES users(id);
-- Fails if content has orphaned user_id values!
```

✅ **Solution:**
```sql
-- Clean up orphaned data first
DELETE FROM content WHERE user_id NOT IN (SELECT id FROM users);

-- Then add constraint
ALTER TABLE content ADD CONSTRAINT fk_content_user
FOREIGN KEY (user_id) REFERENCES users(id);
```

### Pitfall 3: Duplicate Migrations

❌ **Problem:**
```
0015_fix_password.sql
0016_fix_password_again.sql
0017_fix_password_final.sql
0018_fix_password_really_final.sql
```

✅ **Solution:**
- Consolidate into one migration
- Disable old migrations
- Test thoroughly before creating new migration

### Pitfall 4: Missing Rollback Plan

❌ **Problem:**
```sql
-- No way to undo this migration
DROP TABLE important_data;
```

✅ **Solution:**
```sql
-- Create backup table first
CREATE TABLE important_data_backup AS SELECT * FROM important_data;

-- Then make changes
DROP TABLE important_data;

-- Document rollback in comments:
-- ROLLBACK: CREATE TABLE important_data AS SELECT * FROM important_data_backup;
```

---

## Testing Strategy

### 1. Local Testing
```bash
# Test on fresh database
dropdb myapp_test
createdb myapp_test
node run-migrations.js

# Test on existing database
node run-migrations.js

# Test idempotency (run twice)
node run-migrations.js
node run-migrations.js
```

### 2. Staging Testing
```bash
# Deploy to staging
railway up --environment staging

# Verify migrations
railway run --environment staging "node run-migrations.js"

# Test application
curl https://staging.myapp.com/health
```

### 3. Production Testing
```bash
# Validate database state first
node validate-database-state.cjs

# Run migrations
railway run --environment production "node run-migrations.js"

# Monitor logs
railway logs --environment production
```

---

## Rollback Strategy

### Option 1: Backup Before Migration
```bash
# Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
node run-migrations.js

# If something goes wrong, restore
psql $DATABASE_URL < backup_20260114_120000.sql
```

### Option 2: Reverse Migration
```sql
-- Create reverse migration file
-- migrations/0026_rollback_0025.sql

-- Undo changes from migration 0025
ALTER TABLE users ALTER COLUMN password SET NOT NULL;
DROP INDEX IF EXISTS idx_users_password_hash;
-- etc.
```

### Option 3: Point-in-Time Recovery (Railway)
```bash
# Railway provides automatic backups
# Restore from Railway dashboard:
# 1. Go to Database > Backups
# 2. Select backup before migration
# 3. Click "Restore"
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Migration tested on local database
- [ ] Migration tested on staging database
- [ ] Migration is idempotent (can run multiple times)
- [ ] Migration has no DO blocks (Railway compatible)
- [ ] Migration has rollback plan
- [ ] Database backup created
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured

### Deployment Steps

1. **Validate Database State**
   ```bash
   node validate-database-state.cjs
   ```

2. **Create Backup**
   ```bash
   railway backup create --environment production
   ```

3. **Run Migrations**
   ```bash
   railway run --environment production "node run-migrations.js"
   ```

4. **Verify Success**
   ```bash
   railway logs --environment production | grep "Migration"
   ```

5. **Test Application**
   ```bash
   curl https://myapp.com/health
   ```

6. **Monitor for Issues**
   - Check error logs
   - Monitor 502 errors
   - Verify user authentication works
   - Check database performance

### Post-Deployment Checklist

- [ ] All migrations executed successfully
- [ ] Application is running without errors
- [ ] User authentication works (OAuth and password)
- [ ] No 502 errors in logs
- [ ] Database performance is normal
- [ ] Team notified of successful deployment

---

## Migration Consolidation

### When to Consolidate

Consolidate migrations when:
- You have more than 3 migrations fixing the same issue
- Migrations are duplicating logic
- Migration execution time is too long
- Migrations are hard to understand

### How to Consolidate

1. **Create New Consolidated Migration**
   ```sql
   -- migrations/0025_consolidated_permanent_fix.sql
   -- Combines logic from migrations 0015-0024
   ```

2. **Disable Old Migrations**
   ```bash
   # Rename to .disabled
   mv migrations/0015_fix.sql migrations/0015_fix.sql.disabled
   mv migrations/0016_fix.sql migrations/0016_fix.sql.disabled
   ```

3. **Update Migration Runner**
   ```javascript
   // Skip .disabled files
   const migrations = fs.readdirSync('migrations')
     .filter(f => f.endsWith('.sql'))
     .filter(f => !f.endsWith('.disabled'));
   ```

4. **Test Thoroughly**
   - Test on fresh database
   - Test on existing database
   - Test idempotency

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Migration Execution Time**
   - Alert if > 60 seconds
   - Investigate if increasing over time

2. **Migration Failures**
   - Alert on any failure
   - Log full error message

3. **Database Performance**
   - Monitor query performance after migration
   - Check for missing indexes

4. **Application Errors**
   - Monitor 502 errors
   - Check authentication failures
   - Verify data integrity

### Logging Best Practices

```sql
-- Add logging to migrations
SELECT 
    'Migration 0025 started' as status,
    NOW() as started_at;

-- ... migration logic ...

SELECT 
    'Migration 0025 completed' as status,
    NOW() as completed_at;
```

---

## Troubleshooting

### Issue: Migration Fails with "column already exists"

**Cause:** Migration is not idempotent

**Solution:**
```sql
-- Use IF NOT EXISTS
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
```

### Issue: Migration Fails with "constraint already exists"

**Cause:** Constraint was added in previous migration

**Solution:**
```sql
-- Check if constraint exists first
-- Or use CREATE INDEX IF NOT EXISTS
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
```

### Issue: Migration Fails with "syntax error at or near DO"

**Cause:** Railway PostgreSQL doesn't support DO blocks in migrations

**Solution:**
```sql
-- Remove DO blocks
-- Use simple SQL with IF NOT EXISTS instead
```

### Issue: 502 Errors After Migration

**Cause:** Database constraint violation (e.g., NOT NULL on password)

**Solution:**
```sql
-- Make password nullable
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

---

## Summary

✅ **DO:**
- Make migrations idempotent
- Check database state before changes
- Use IF NOT EXISTS
- Test on fresh and existing databases
- Create backups before deployment
- Document rollback plan
- Monitor after deployment

❌ **DON'T:**
- Use DO blocks (Railway incompatible)
- Add NOT NULL to existing tables without defaults
- Create duplicate migrations
- Skip testing
- Deploy without backup
- Ignore warnings

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [Database Migration Patterns](https://martinfowler.com/articles/evodb.html)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

---

**Last Updated:** 2026-01-14  
**Version:** 1.0  
**Author:** Senior DB Expert
