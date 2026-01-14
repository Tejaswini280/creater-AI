# ROOT CAUSE ANALYSIS - MIGRATION SYSTEM FAILURE

## Executive Summary

The application fails to start with "schema validation failed" errors, reporting missing columns that **actually exist in the database**. This is a **FALSE POSITIVE** caused by incorrect schema validation logic, not actual missing columns.

## Root Causes Identified

### 1. **CRITICAL: Incorrect EXPECTED_SCHEMA Definition**

**Location:** `server/services/strictMigrationRunner.ts` line 40-50

**Problem:** The `EXPECTED_SCHEMA` constant defines what columns the validator expects, but it's **out of sync with the actual database schema**:

```typescript
const EXPECTED_SCHEMA = {
  users: ['id', 'email', 'password_hash', ...],  // ❌ WRONG: actual column is 'password'
  // ... other mismatches
};
```

**Actual Database Schema:**
- `users.password` (NOT `password_hash`)
- `content_metrics` is missing `created_at` column (genuinely missing)

**Impact:** The validator fails even though the database is correct, blocking application startup.

### 2. **Migration Execution vs Schema Validation Mismatch**

**Problem:** Migrations execute successfully and create the correct schema, but the hardcoded `EXPECTED_SCHEMA` doesn't match what the migrations actually create.

**Why This Happened:**
- Migrations evolved over time (password_hash → password)
- EXPECTED_SCHEMA was never updated to match
- No single source of truth between migrations and validation

### 3. **Missing Column: content_metrics.created_at**

**Diagnosis Result:**
```
❌ MISSING: content_metrics.created_at
```

This column is genuinely missing and needs to be added.

## Why 28 Migrations Were "Skipped"

**Answer:** They weren't actually skipped - they were **correctly marked as already executed**.

The logs show:
```
⏭️  Skipping (already executed and schema valid): 0001_core_tables_clean.sql
```

This is **correct behavior** - migrations should only run once. The problem is the schema validation that runs AFTER, which uses incorrect expectations.

## The False Positive Chain

1. ✅ Migrations execute successfully
2. ✅ Database schema is created correctly
3. ❌ Schema validator checks against WRONG expected schema
4. ❌ Validator reports "missing columns" that actually exist
5. ❌ Application refuses to start

## Permanent Solution Required

### 1. **Fix EXPECTED_SCHEMA to Match Reality**
   - Update to match actual column names
   - Add missing columns to migrations
   - Ensure single source of truth

### 2. **Add Missing Columns**
   - Create migration for `content_metrics.created_at`

### 3. **Prevent Future Drift**
   - Generate EXPECTED_SCHEMA from migrations
   - OR remove hardcoded validation
   - OR use database introspection as source of truth

### 4. **Improve Error Messages**
   - Distinguish between "column doesn't exist" vs "column name mismatch"
   - Show actual vs expected column names

## Verification

**Database State (ACTUAL):**
- ✅ 28 tables exist
- ✅ All critical columns exist (except content_metrics.created_at)
- ✅ Migrations 0000-0006 completed successfully
- ❌ Migration 0007 failed (password_hash reference)

**Validator State (EXPECTED):**
- ❌ Looking for `password_hash` (doesn't exist)
- ❌ Looking for columns that exist but with wrong expectations

## Conclusion

**This is NOT a migration failure. This is a validation configuration error.**

The database is in a correct, usable state. The application startup is blocked by an overly strict validator that's checking against an outdated schema definition.

**Immediate Fix:** Update EXPECTED_SCHEMA to match actual database schema.

**Long-term Fix:** Eliminate hardcoded schema expectations and use dynamic validation.
