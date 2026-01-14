#!/usr/bin/env pwsh

Write-Host "🚀 Pushing application status updates to dev branch" -ForegroundColor Cyan

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Switch to dev branch
Write-Host "Switching to dev branch..." -ForegroundColor Yellow
git checkout dev
git pull origin dev

# Add application status files
Write-Host "Adding application status files..." -ForegroundColor Yellow

# Add the new status files
git add APPLICATION_RUNNING_STATUS_CURRENT.md -f
git add DOCKER_VERIFICATION_AND_PUSH_SUMMARY.md -f

# Add any other documentation updates
git add *.md -f 2>$null

Write-Host "Added application status files" -ForegroundColor Green

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Application Status Update: Fully Running and Verified - App LIVE at http://127.0.0.1:5000 - All systems operational"

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "✅ Application status updates pushed to dev branch!" -ForegroundColor Green