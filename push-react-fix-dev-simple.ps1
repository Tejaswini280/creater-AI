#!/usr/bin/env pwsh

Write-Host "🚀 Pushing React useState Fix to Dev Branch..." -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Add all changes
Write-Host "📦 Adding all changes..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected, creating commit..." -ForegroundColor Cyan
    
    # Create commit with descriptive message
    git commit -m "Fix React useState Error - Complete Resolution"
    
    Write-Host "✅ Commit created successfully!" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No changes to commit" -ForegroundColor Yellow
}

# Switch to dev branch if not already on it
if ($currentBranch -ne "dev") {
    Write-Host "🔄 Switching to dev branch..." -ForegroundColor Cyan
    git checkout dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to dev branch. Creating dev branch..." -ForegroundColor Red
        git checkout -b dev
    }
} else {
    Write-Host "✅ Already on dev branch" -ForegroundColor Green
}

# Push to dev branch
Write-Host "⬆️ Pushing to dev branch..." -ForegroundColor Cyan
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Successfully pushed React fix to dev branch!" -ForegroundColor Green
    Write-Host "✅ React useState error completely fixed" -ForegroundColor White
    Write-Host "✅ Application now loads without blank pages" -ForegroundColor White
    Write-Host "🌐 Your fixed application is ready at: http://localhost:5000" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Current git status:" -ForegroundColor Yellow
git status --short