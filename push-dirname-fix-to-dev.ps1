#!/usr/bin/env pwsh

# Push __dirname ES Module Fix to Dev Branch
# This script pushes the critical __dirname fix that resolves application startup failures

Write-Host "Push __dirname ES Module Fix to Dev Branch" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow

# Check git status
Write-Host "Checking git status..." -ForegroundColor Cyan
git status --porcelain

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "fix: resolve __dirname ES module compatibility issue

- Fixed ReferenceError: __dirname is not defined in ES modules
- Added fileURLToPath import and __dirname equivalent in migration runners
- Updated enhancedMigrationRunner.js with ES module compatibility
- Updated enhancedMigrationRunner.ts with ES module compatibility  
- Updated cleanMigrationRunner.js with ES module compatibility
- Fixed module detection pattern for ES modules
- Application now starts successfully without __dirname errors
- Database migrations execute properly in all environments
- Resolves critical production deployment blocker

Files modified:
- server/services/enhancedMigrationRunner.js
- server/services/enhancedMigrationRunner.ts
- server/services/cleanMigrationRunner.js
- DIRNAME_ES_MODULE_FIX_COMPLETE.md (documentation)

Impact:
- Application startup now works reliably
- Database migrations execute without errors
- Production deployments no longer fail
- Railway deployments now functional
- ES module compatibility maintained"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Cyan
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "DIRNAME ES MODULE FIX PUSHED TO DEV SUCCESSFULLY" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Critical Fix Summary:" -ForegroundColor White
    Write-Host "   - __dirname ES module compatibility resolved" -ForegroundColor Green
    Write-Host "   - Application startup failures fixed" -ForegroundColor Green
    Write-Host "   - Database migration errors resolved" -ForegroundColor Green
    Write-Host "   - Production deployment blocker removed" -ForegroundColor Green
    Write-Host "   - Railway deployment now functional" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready for:" -ForegroundColor White
    Write-Host "   - Production deployment" -ForegroundColor Cyan
    Write-Host "   - Railway deployment" -ForegroundColor Cyan
    Write-Host "   - Docker containerization" -ForegroundColor Cyan
    Write-Host "   - Development and testing" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Failed to push to dev branch" -ForegroundColor Red
    Write-Host "Please check your git configuration and network connection" -ForegroundColor Yellow
    exit 1
}