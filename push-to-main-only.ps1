#!/usr/bin/env pwsh

Write-Host "Pushing to Main Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host ""

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current Branch: $currentBranch" -ForegroundColor White

# Switch to main branch
Write-Host "`nSwitching to main branch..." -ForegroundColor Cyan
git checkout main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Main branch doesn't exist locally, creating it..." -ForegroundColor Yellow
    git checkout -b main
}

# Merge dev branch into main
Write-Host "`nMerging dev branch into main..." -ForegroundColor Cyan
git merge dev --no-edit

if ($LASTEXITCODE -eq 0) {
    Write-Host "Merge successful!" -ForegroundColor Green
} else {
    Write-Host "Merge failed!" -ForegroundColor Red
    Write-Host "You may need to resolve conflicts manually" -ForegroundColor Yellow
    exit 1
}

# Push to main branch
Write-Host "`nPushing to main branch..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Pushed to main branch!" -ForegroundColor Green
    Write-Host "`nView changes at: https://github.com/Tejaswini280/creater-AI/tree/main" -ForegroundColor Cyan
} else {
    Write-Host "Push to main failed!" -ForegroundColor Red
    Write-Host "Try manual push: git push origin main" -ForegroundColor Yellow
}

# Return to original branch
Write-Host "`nReturning to original branch: $currentBranch" -ForegroundColor Cyan
git checkout $currentBranch

Write-Host "`nBoth branches updated successfully!" -ForegroundColor Green
Write-Host "Dev: https://github.com/Tejaswini280/creater-AI/tree/dev" -ForegroundColor Cyan
Write-Host "Main: https://github.com/Tejaswini280/creater-AI/tree/main" -ForegroundColor Cyan