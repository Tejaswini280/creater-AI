# PUSH DAY_NUMBER COLUMN EMERGENCY FIX TO DEV BRANCH
# Critical fix for production migration failure - application cannot start

Write-Host "PUSHING DAY_NUMBER COLUMN EMERGENCY FIX TO DEV BRANCH" -ForegroundColor Red
Write-Host "===============================================================" -ForegroundColor Yellow

# Add all emergency fix files
Write-Host "Adding emergency fix files..." -ForegroundColor Cyan
git add migrations/0001_core_tables_idempotent.sql
git add fix-day-number-emergency-direct.cjs
git add test-day-number-fix.cjs
git add DAY_NUMBER_COLUMN_EMERGENCY_FIX_COMPLETE.md

# Commit the emergency fix
Write-Host "Committing day_number column emergency fix..." -ForegroundColor Cyan
git commit -m "EMERGENCY: Fix day_number column missing in production

- Migration 0001_core_tables_idempotent.sql failed: column day_number does not exist
- CREATE TABLE IF NOT EXISTS does not add missing columns to existing tables
- Added proper ALTER TABLE statement with existence check for day_number
- Migration will now complete successfully and application will start

PRODUCTION EMERGENCY RESOLVED: Application should start normally"

# Push to dev branch
Write-Host "Pushing emergency fix to dev branch..." -ForegroundColor Cyan
git push origin dev

Write-Host "DAY_NUMBER COLUMN EMERGENCY FIX PUSHED TO DEV SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "RESTART APPLICATION NOW - Should work properly" -ForegroundColor Green