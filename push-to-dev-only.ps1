#!/usr/bin/env pwsh

Write-Host "Pushing to Dev Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host ""

# Check current status
Write-Host "Current Git Status:" -ForegroundColor Cyan
git status --short

# Add all changes
Write-Host "`nAdding all changes..." -ForegroundColor Cyan
git add .

# Show what we're committing
Write-Host "`nFiles to Commit:" -ForegroundColor Cyan
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    $stagedFiles | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
    }
    
    # Create commit
    Write-Host "`nCreating Commit..." -ForegroundColor Cyan
    $commitMessage = "feat: Complete application fixes and enhancements

Database Fixes:
- Fixed missing database tables (ai_generation_tasks, structured_outputs, generated_code)
- Resolved Express rate limiting configuration (trust proxy)
- Fixed Content scheduler null date handling
- Resolved database column compatibility issues

Application Enhancements:
- Added comprehensive application status checking
- Created launch scripts for easy startup
- Implemented database schema verification
- Added application startup testing

New Files:
- fix-database-schema-issues.cjs - Database schema verification
- fix-express-rate-limit-config.cjs - Express configuration fixes
- fix-all-database-issues.cjs - Comprehensive database fixes
- test-application-startup.cjs - Application startup testing
- check-app-status.cjs - Application status verification
- launch-app.ps1 - Easy application launcher

Modified Files:
- server/index.ts - Added trust proxy configuration
- server/services/scheduler.ts - Fixed null date handling

Result: Application runs successfully with all services working"

    git commit -m "$commitMessage"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commit created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Commit failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Push to dev branch
Write-Host "`nPushing to dev branch..." -ForegroundColor Cyan
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Pushed to dev branch!" -ForegroundColor Green
    Write-Host "`nView changes at: https://github.com/Tejaswini280/creater-AI/tree/dev" -ForegroundColor Cyan
} else {
    Write-Host "Push to dev failed!" -ForegroundColor Red
    Write-Host "Try manual push: git push origin dev" -ForegroundColor Yellow
}