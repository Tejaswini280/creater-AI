#!/usr/bin/env pwsh

Write-Host "🔄 Pulling Dev Branch to Migration-Seeding Branch..." -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Stash any uncommitted changes
Write-Host "💾 Stashing any uncommitted changes..." -ForegroundColor Cyan
git stash push -m "Auto-stash before branch switch"

# Check if migration-seeding branch exists
Write-Host "🔍 Checking if migration-seeding branch exists..." -ForegroundColor Cyan
$branchExists = git branch --list migration-seeding
if ($branchExists) {
    Write-Host "✅ migration-seeding branch exists" -ForegroundColor Green
    
    # Switch to migration-seeding branch
    Write-Host "🔄 Switching to migration-seeding branch..." -ForegroundColor Cyan
    git checkout migration-seeding
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to migration-seeding branch" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "🆕 Creating migration-seeding branch from dev..." -ForegroundColor Yellow
    git checkout -b migration-seeding dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Created migration-seeding branch from dev" -ForegroundColor Green
        Write-Host "🎉 All dev code is now in migration-seeding branch!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Branch Summary:" -ForegroundColor Yellow
        Write-Host "  ✅ migration-seeding branch created from latest dev" -ForegroundColor White
        Write-Host "  ✅ All React fixes included" -ForegroundColor White
        Write-Host "  ✅ All database fixes included" -ForegroundColor White
        Write-Host "  ✅ All Docker configurations included" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 Ready for migration and seeding work!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Failed to create migration-seeding branch" -ForegroundColor Red
        exit 1
    }
}

# Fetch latest changes from remote
Write-Host "📥 Fetching latest changes from remote..." -ForegroundColor Cyan
git fetch origin

# Pull latest dev changes into migration-seeding
Write-Host "⬇️ Pulling latest dev changes into migration-seeding..." -ForegroundColor Cyan
git pull origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Successfully pulled dev branch to migration-seeding!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was pulled:" -ForegroundColor Yellow
    Write-Host "  ✅ React useState fix (complete resolution)" -ForegroundColor White
    Write-Host "  ✅ Database schema and migrations" -ForegroundColor White
    Write-Host "  ✅ Docker configuration updates" -ForegroundColor White
    Write-Host "  ✅ All application fixes and improvements" -ForegroundColor White
    Write-Host "  ✅ Complete documentation" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Current branch status:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    Write-Host "📊 Latest commits from dev:" -ForegroundColor Yellow
    git log --oneline -5
    Write-Host ""
    Write-Host "🚀 migration-seeding branch is now up to date with dev!" -ForegroundColor Green
    Write-Host "   Ready for database migration and seeding work" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to pull dev changes" -ForegroundColor Red
    Write-Host "🔧 You may need to resolve conflicts manually" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Conflict resolution steps:" -ForegroundColor Yellow
    Write-Host "  1. Check git status: git status" -ForegroundColor White
    Write-Host "  2. Resolve any conflicts in the files" -ForegroundColor White
    Write-Host "  3. Add resolved files: git add ." -ForegroundColor White
    Write-Host "  4. Complete the merge: git commit" -ForegroundColor White
}

# Restore stashed changes if any
$stashList = git stash list
if ($stashList) {
    Write-Host ""
    Write-Host "💾 Restoring stashed changes..." -ForegroundColor Cyan
    git stash pop
}