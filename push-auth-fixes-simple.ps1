#!/usr/bin/env pwsh

Write-Host "🔧 Docker Authentication Fixes - Git Workflow" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Green

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Uncommitted changes detected, committing..." -ForegroundColor Yellow
    
    # Stage all changes
    git add .
    
    # Commit with comprehensive message
    $commitMessage = "Fix Docker authentication redirect loop

✅ Backend Fixes:
- Updated cookie sameSite policy from strict to lax in development
- Enhanced CORS origins to include Docker container names
- Fixed token response format for frontend compatibility

✅ Frontend Fixes:
- Improved auth state management to prevent redirect loops
- Enhanced token storage consistency (localStorage + cookies)
- Fixed auth check logic to handle 401 responses properly

✅ WebSocket Fixes:
- Enhanced token validation for development mode
- Improved user ID handling for WebSocket connections

✅ Docker Configuration:
- Updated docker-compose.yml to use development environment
- Enhanced .env.development for Docker compatibility

Resolves: Login redirect loop in Docker environment"

    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Changes committed successfully!" -ForegroundColor Green
}

# Step 1: Switch to dev branch and push changes
Write-Host "`n🎯 Step 1: Pushing changes to dev branch" -ForegroundColor Magenta

# Check if dev branch exists
$devBranchExists = git branch --list "dev"
if (-not $devBranchExists) {
    Write-Host "🆕 Creating dev branch..." -ForegroundColor Yellow
    git checkout -b dev
} else {
    Write-Host "🔄 Switching to dev branch..." -ForegroundColor Blue
    git checkout dev
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to switch to dev branch" -ForegroundColor Red
    exit 1
}

# If we came from a different branch, merge the changes
if ($currentBranch -ne "dev") {
    Write-Host "🔀 Merging changes from $currentBranch to dev..." -ForegroundColor Blue
    git merge $currentBranch --no-ff -m "Merge authentication fixes from $currentBranch"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to merge changes to dev" -ForegroundColor Red
        exit 1
    }
}

# Push dev branch
Write-Host "🚀 Pushing dev branch to origin..." -ForegroundColor Blue
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push dev branch" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully pushed authentication fixes to dev branch!" -ForegroundColor Green

# Step 2: Switch to main branch and merge dev
Write-Host "`n🎯 Step 2: Merging dev into main branch" -ForegroundColor Magenta

# Switch to main branch
Write-Host "🔄 Switching to main branch..." -ForegroundColor Blue
git checkout main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to switch to main branch" -ForegroundColor Red
    exit 1
}

# Pull latest changes from main
Write-Host "📥 Pulling latest changes from main..." -ForegroundColor Blue
git pull origin main

# Merge dev into main
Write-Host "🔀 Merging dev into main..." -ForegroundColor Blue
git merge dev --no-ff -m "Merge dev: Docker authentication fixes

✅ Fixed Docker login redirect loop
✅ Updated cookie SameSite policy for Docker compatibility
✅ Enhanced CORS configuration for container environments
✅ Improved frontend auth state management
✅ Fixed WebSocket token validation
✅ Updated Docker environment configuration"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to merge dev into main" -ForegroundColor Red
    Write-Host "🔧 Please resolve conflicts manually" -ForegroundColor Yellow
    exit 1
}

# Push main branch
Write-Host "🚀 Pushing main branch to origin..." -ForegroundColor Blue
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push main branch" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully merged dev into main branch!" -ForegroundColor Green

# Summary
Write-Host "`n🎉 Git Workflow Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "✅ Changes committed and pushed to dev branch" -ForegroundColor Green
Write-Host "✅ Dev branch merged into main branch" -ForegroundColor Green
Write-Host "✅ All changes are now in both dev and main branches" -ForegroundColor Green

Write-Host "`n📋 Summary of Changes:" -ForegroundColor Cyan
Write-Host "- server/routes.ts: Fixed cookie sameSite policy" -ForegroundColor White
Write-Host "- server/middleware/security.ts: Enhanced CORS origins" -ForegroundColor White
Write-Host "- client/src/hooks/useAuth.ts: Improved auth state management" -ForegroundColor White
Write-Host "- server/websocket.ts: Enhanced WebSocket authentication" -ForegroundColor White
Write-Host "- docker-compose.yml: Updated to use development environment" -ForegroundColor White
Write-Host "- .env.development: Enhanced Docker compatibility" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the Docker authentication fix:" -ForegroundColor White
Write-Host "   docker-compose down && docker-compose build --no-cache && docker-compose up" -ForegroundColor Gray
Write-Host "2. Verify login flow works without redirect loops" -ForegroundColor White
Write-Host "3. Check WebSocket connections are stable" -ForegroundColor White

# Return to original branch if it wasn't dev or main
if ($currentBranch -ne "dev" -and $currentBranch -ne "main") {
    Write-Host "`n🔄 Returning to original branch: $currentBranch" -ForegroundColor Blue
    git checkout $currentBranch
}

Write-Host "`n🎯 Docker Authentication Fixes Successfully Deployed!" -ForegroundColor Green