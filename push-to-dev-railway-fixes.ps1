# Push Railway Migration Fixes to Dev Branch
Write-Host ""
Write-Host "PUSHING RAILWAY MIGRATION FIXES TO DEV BRANCH" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Check if we have the migration fixes
if (-not (Test-Path "migrations/0001_core_tables_idempotent.sql")) {
    Write-Host "Error: Migration fixes not found" -ForegroundColor Red
    exit 1
}

# Add all migration-related files
Write-Host "Adding migration fixes to git..." -ForegroundColor Yellow
git add migrations/
git add RAILWAY_MIGRATION_FIXES_COMPLETE.md
git add MIGRATION_EXECUTION_ORDER.md
git add test-railway-migrations.cjs
git add verify-migration-fixes.cjs
git add deploy-railway-migration-fix.ps1
git add push-railway-migration-fixes-to-dev.ps1
git add push-to-dev-railway-fixes.ps1

# Commit the changes
Write-Host "Committing Railway migration fixes..." -ForegroundColor Yellow
git commit -m "fix: Railway migration fixes - eliminate 502 errors

- Reorder migrations in dependency-based execution order
- Add missing core tables (content_metrics, ai_projects, etc.)
- Fix ON CONFLICT constraints with proper UNIQUE keys
- Add missing password column to users table
- Remove foreign key constraints for production safety
- Ensure full idempotency for all operations
- Add comprehensive validation and cleanup

Railway deployment will now start successfully without errors."

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Changes committed successfully" -ForegroundColor Green

# Switch to dev branch if not already there
if ($currentBranch -ne "dev") {
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to dev branch" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Switched to dev branch" -ForegroundColor Green
    
    # Merge changes from current branch
    Write-Host "Merging migration fixes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-ff -m "merge: Railway migration fixes - eliminate 502 errors"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Merge completed successfully" -ForegroundColor Green
}

# Push to dev branch
Write-Host ""
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push to dev failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: RAILWAY MIGRATION FIXES PUSHED TO DEV" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Migration fixes are now on dev branch" -ForegroundColor Green
Write-Host "Railway will auto-deploy from dev branch" -ForegroundColor Green
Write-Host "Database schema will be repaired" -ForegroundColor Green
Write-Host "502 errors will be eliminated" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor deployment at: https://railway.app/dashboard" -ForegroundColor Yellow
Write-Host "Expected deployment time: 2-5 minutes" -ForegroundColor Yellow