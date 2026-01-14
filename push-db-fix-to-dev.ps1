#!/usr/bin/env pwsh

# Push Database Password Fix to Dev Branch
Write-Host "Pushing Database Password Fix to Dev Branch" -ForegroundColor Cyan

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Ensure we're on main branch
if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to main branch" -ForegroundColor Red
        exit 1
    }
}

# Pull latest changes
Write-Host "Pulling latest changes from main..." -ForegroundColor Yellow
git pull origin main

# Add database fix files
Write-Host "Adding database fix files..." -ForegroundColor Yellow
git add fix-password-column-issue.cjs
git add verify-database-fix.cjs
git add database-fix-summary.md
git add migrations/
git add scripts/seed-database.js

# Check status
Write-Host "Files to be committed:" -ForegroundColor Yellow
git status --porcelain

# Commit changes
$commitMessage = "fix: resolve database password column initialization issue"
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to main
Write-Host "Pushing to main branch..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to main" -ForegroundColor Red
    exit 1
}

# Switch to dev branch
Write-Host "Switching to dev branch..." -ForegroundColor Yellow
git checkout dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Dev branch doesn't exist, creating it..." -ForegroundColor Yellow
    git checkout -b dev
}

# Merge main into dev
Write-Host "Merging main into dev..." -ForegroundColor Yellow
git merge main

# Push to dev
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to dev" -ForegroundColor Red
    exit 1
}

# Return to main
Write-Host "Returning to main branch..." -ForegroundColor Yellow
git checkout main

Write-Host ""
Write-Host "DATABASE PASSWORD FIX SUCCESSFULLY PUSHED TO DEV" -ForegroundColor Green
Write-Host "Changes are now available on both main and dev branches" -ForegroundColor Green