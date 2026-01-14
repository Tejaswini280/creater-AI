# Deploy Password Hash Root Cause Fix
# This fixes migrations 0007 and 0009 to allow NULL password_hash

Write-Host "Deploying Password Hash Root Cause Fix..." -ForegroundColor Cyan
Write-Host ""

# Commit the fixes
Write-Host "Committing migration fixes..." -ForegroundColor Yellow
git add migrations/0007_production_repair_idempotent.sql
git add migrations/0009_railway_production_repair_complete.sql
git commit -m "fix: Allow NULL password_hash in migrations 0007 and 0009 - Root cause fix for Railway 502"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: Files may already be committed" -ForegroundColor Yellow
}

# Push to dev
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "ROOT CAUSE FIX DEPLOYED" -ForegroundColor Green
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Yellow
Write-Host "  - Migration 0007: Removed NOT NULL constraint from password_hash" -ForegroundColor White
Write-Host "  - Migration 0009: Removed NOT NULL constraint from password_hash" -ForegroundColor White
Write-Host "  - Both migrations now allow NULL for OAuth users" -ForegroundColor White
Write-Host ""
Write-Host "Railway will now redeploy automatically" -ForegroundColor Cyan
Write-Host ""
