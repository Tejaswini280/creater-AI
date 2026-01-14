#!/usr/bin/env pwsh

Write-Host "Pushing to Dev and Main Branches..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host ""

# Check current status
Write-Host "Current Git Status:" -ForegroundColor Cyan
git status --short

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current Branch: $currentBranch" -ForegroundColor White

# Add all new files and changes
Write-Host "`nAdding all changes..." -ForegroundColor Cyan
git add .

# Show what we're committing
Write-Host "`nFiles to Commit:" -ForegroundColor Cyan
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    $stagedFiles | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
    }
} else {
    Write-Host "  No changes to commit" -ForegroundColor Yellow
}

# Create commit if there are changes
if ($stagedFiles) {
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
- DATABASE_FIXES_SUMMARY.md - Complete fix documentation

Modified Files:
- server/index.ts - Added trust proxy configuration
- server/services/scheduler.ts - Fixed null date handling

Result: Application runs successfully with all services working
Status: Database connected, scheduler initialized, all features functional"

    git commit -m "$commitMessage"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commit created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Commit failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No changes to commit, proceeding with existing commits..." -ForegroundColor Yellow
}

# Function to push to a branch
function Push-ToBranch {
    param($branchName)
    
    Write-Host "`nSwitching to $branchName branch..." -ForegroundColor Cyan
    git checkout $branchName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Branch $branchName doesn't exist locally, creating it..." -ForegroundColor Yellow
        git checkout -b $branchName
    }
    
    # Merge changes if we're not already on the target branch
    if ($currentBranch -ne $branchName -and $stagedFiles) {
        Write-Host "Merging changes from $currentBranch..." -ForegroundColor Cyan
        git merge $currentBranch --no-edit
    }
    
    Write-Host "Pushing to $branchName..." -ForegroundColor Cyan
    
    # Try direct push
    git push origin $branchName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to $branchName!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Failed to push to $branchName" -ForegroundColor Red
        return $false
    }
}

# Push to dev branch first
Write-Host "`nStep 1: Pushing to DEV branch..." -ForegroundColor Magenta
$devSuccess = Push-ToBranch "dev"

# Push to main branch
Write-Host "`nStep 2: Pushing to MAIN branch..." -ForegroundColor Magenta
$mainSuccess = Push-ToBranch "main"

# Return to original branch
Write-Host "`nReturning to original branch: $currentBranch" -ForegroundColor Cyan
git checkout $currentBranch

# Summary
Write-Host "`nPush Summary:" -ForegroundColor Cyan
Write-Host "=" * 50
if ($devSuccess) {
    Write-Host "DEV branch: Successfully pushed" -ForegroundColor Green
} else {
    Write-Host "DEV branch: Push failed" -ForegroundColor Red
}

if ($mainSuccess) {
    Write-Host "MAIN branch: Successfully pushed" -ForegroundColor Green
} else {
    Write-Host "MAIN branch: Push failed" -ForegroundColor Red
}

if ($devSuccess -and $mainSuccess) {
    Write-Host "`nSUCCESS! Changes pushed to both branches!" -ForegroundColor Green
    Write-Host "`nView changes at:" -ForegroundColor Yellow
    Write-Host "  Dev: https://github.com/Tejaswini280/creater-AI/tree/dev" -ForegroundColor Cyan
    Write-Host "  Main: https://github.com/Tejaswini280/creater-AI/tree/main" -ForegroundColor Cyan
} else {
    Write-Host "`nSome pushes failed. Check errors above." -ForegroundColor Yellow
}