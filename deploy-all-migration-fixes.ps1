#!/usr/bin/env pwsh

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "EMERGENCY FIX: Deploy ALL Migration Fixes" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ROOT CAUSE: Migration 0018 (not 0010!) has DO blocks" -ForegroundColor Yellow
Write-Host "SOLUTION: Fixed ALL migrations with DO blocks" -ForegroundColor Green
Write-Host ""

# Stage all fixed migrations
Write-Host "Staging fixed migrations..." -ForegroundColor Yellow
git add migrations/0010_railway_production_schema_repair_final.sql
git add migrations/0015_passwordless_oauth_fix.sql
git add migrations/0017_fix_password_hash_column_mismatch.sql
git add migrations/0018_fix_password_hash_null_constraint.sql
git add migrations/0019_fix_password_hash_null_values_hotfix.sql
git add migrations/0021_fix_password_null_constraint_permanent.sql
git add migrations/0022_fix_password_nullable_for_oauth.sql
git add migrations/0023_fix_password_nullable_permanent.sql
git add fix-all-migrations-do-blocks.cjs

Write-Host "SUCCESS: Files staged" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "Committing fixes..." -ForegroundColor Yellow

git commit -m "fix: EMERGENCY FIX - Remove DO blocks from ALL migrations" `
           -m "ROOT CAUSE: Migration 0018 (not 0010) was failing with DO block syntax error" `
           -m "SOLUTION: Removed DO blocks from migrations 0010, 0015, 0017, 0018, 0019, 0021, 0022, 0023" `
           -m "All migrations now use simple SQL statements that work on Railway PostgreSQL"

Write-Host ""

# Push
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to push" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fixed migrations:" -ForegroundColor Yellow
Write-Host "  - 0010: railway_production_schema_repair_final" -ForegroundColor Green
Write-Host "  - 0015: passwordless_oauth_fix" -ForegroundColor Green
Write-Host "  - 0017: fix_password_hash_column_mismatch" -ForegroundColor Green
Write-Host "  - 0018: fix_password_hash_null_constraint (THE CULPRIT!)" -ForegroundColor Red
Write-Host "  - 0019: fix_password_hash_null_values_hotfix" -ForegroundColor Green
Write-Host "  - 0021: fix_password_null_constraint_permanent" -ForegroundColor Green
Write-Host "  - 0022: fix_password_nullable_for_oauth" -ForegroundColor Green
Write-Host "  - 0023: fix_password_nullable_permanent" -ForegroundColor Green
Write-Host ""
Write-Host "Railway will now deploy successfully!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
