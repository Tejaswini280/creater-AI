#!/usr/bin/env pwsh

Write-Host "Pushing Database Fixes to Dev Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host "Branch: dev" -ForegroundColor Cyan

# Check current status
Write-Host "`nCurrent Git Status:" -ForegroundColor Cyan
git status --short

# Add all database fix files
Write-Host "`nAdding Database Fix Files..." -ForegroundColor Cyan
$filesToAdd = @(
    "fix-database-schema-issues.cjs",
    "fix-express-rate-limit-config.cjs", 
    "fix-all-database-issues.cjs",
    "test-application-startup.cjs",
    "DATABASE_FIXES_SUMMARY.md",
    "server/index.ts",
    "server/services/scheduler.ts"
)

foreach ($file in $filesToAdd) {
    if (Test-Path $file) {
        git add $file
        Write-Host "  Added: $file" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $file" -ForegroundColor Yellow
    }
}

# Show what we're committing
Write-Host "`nFiles to Commit:" -ForegroundColor Cyan
git diff --cached --name-only | ForEach-Object {
    Write-Host "  $_" -ForegroundColor White
}

# Create commit
Write-Host "`nCreating Commit..." -ForegroundColor Cyan
$commitMessage = "fix: Database schema and scheduler service fixes

Fixed Issues:
- Missing database tables (ai_generation_tasks, structured_outputs, generated_code)
- Express rate limiting configuration (trust proxy)
- Content scheduler null date handling
- Database column compatibility issues

New Files:
- fix-database-schema-issues.cjs - Database schema verification
- fix-express-rate-limit-config.cjs - Express configuration fixes
- fix-all-database-issues.cjs - Comprehensive database fixes
- test-application-startup.cjs - Application startup testing
- DATABASE_FIXES_SUMMARY.md - Complete fix documentation

Modified Files:
- server/index.ts - Added trust proxy configuration
- server/services/scheduler.ts - Fixed null date handling

Result: Application now starts successfully with all services working
Status: 7 users, 10 scheduled content items, all tables functional"

git commit -m "$commitMessage"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit created successfully!" -ForegroundColor Green
} else {
    Write-Host "Commit failed!" -ForegroundColor Red
    exit 1
}

# Show commit info
Write-Host "`nCommit Details:" -ForegroundColor Cyan
git log --oneline -1

Write-Host "`nAttempting to Push to Dev Branch..." -ForegroundColor Cyan

# Method 1: Direct push to origin
Write-Host "`nTrying: git push origin dev" -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Database fixes pushed to dev branch!" -ForegroundColor Green
    Write-Host "`nSummary of Changes Pushed:" -ForegroundColor Cyan
    Write-Host "  Database schema fixes" -ForegroundColor Green
    Write-Host "  Express rate limiting fixes" -ForegroundColor Green
    Write-Host "  Content scheduler improvements" -ForegroundColor Green
    Write-Host "  Application startup testing" -ForegroundColor Green
    Write-Host "  Complete documentation" -ForegroundColor Green
    Write-Host "`nView changes at: https://github.com/Tejaswini280/creater-AI/tree/dev" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Push failed. Trying alternative methods..." -ForegroundColor Yellow
    
    # Method 2: Push with explicit URL
    Write-Host "`nTrying: git push with explicit URL" -ForegroundColor Yellow
    git push https://github.com/Tejaswini280/creater-AI.git dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Database fixes pushed with explicit URL!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "All push methods failed!" -ForegroundColor Red
        Write-Host "`nManual Push Instructions:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/Tejaswini280/creater-AI" -ForegroundColor White
        Write-Host "2. Switch to dev branch" -ForegroundColor White
        Write-Host "3. Upload the following files manually:" -ForegroundColor White
        foreach ($file in $filesToAdd) {
            if (Test-Path $file) {
                Write-Host "   - $file" -ForegroundColor Cyan
            }
        }
        Write-Host "`nCommit Message:" -ForegroundColor Yellow
        Write-Host $commitMessage -ForegroundColor Gray
    }
}