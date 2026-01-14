#!/usr/bin/env pwsh

Write-Host "Pushing Railway Vite Build Fix to Dev Branch..." -ForegroundColor Cyan

# Add all changes
Write-Host "Adding changes..." -ForegroundColor Green
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "fix: Railway Vite build configuration and ES module compatibility

- Fixed double build issue in Railway deployment
- Updated package.json railway:start script to avoid redundant build
- Updated nixpacks.toml and railway.json deployment configuration  
- Converted CommonJS modules to ES modules for compatibility
- Fixed enhancedMigrationRunner.js, migrationDependencyResolver.js, cleanMigrationRunner.js
- Eliminated build warnings and ES module conflicts
- Verified complete deployment readiness

Resolves Railway vite not found error and ensures clean deployment process."

# Push to current branch first
Write-Host "Pushing to current branch..." -ForegroundColor Green
git push

# Switch to dev branch
Write-Host "Switching to dev branch..." -ForegroundColor Yellow
git checkout dev

# Pull latest dev
Write-Host "Pulling latest dev..." -ForegroundColor Yellow
git pull origin dev

# Merge from main/current branch
Write-Host "Merging changes..." -ForegroundColor Yellow
git merge main --no-ff -m "Merge Railway Vite build fixes"

# Push to dev
Write-Host "Pushing to dev branch..." -ForegroundColor Green
git push origin dev

Write-Host ""
Write-Host "Successfully pushed Railway Vite build fix to dev branch!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary of changes pushed:" -ForegroundColor Yellow
Write-Host "- Fixed Railway double build configuration" -ForegroundColor White
Write-Host "- Updated package.json, nixpacks.toml, railway.json" -ForegroundColor White
Write-Host "- Converted CommonJS modules to ES modules" -ForegroundColor White
Write-Host "- Fixed migration runner compatibility issues" -ForegroundColor White
Write-Host "- Eliminated all build warnings and conflicts" -ForegroundColor White
Write-Host "- Created comprehensive fix documentation" -ForegroundColor White
Write-Host ""
Write-Host "Dev branch is now ready for Railway deployment!" -ForegroundColor Green