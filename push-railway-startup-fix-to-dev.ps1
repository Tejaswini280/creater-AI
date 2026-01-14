#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Railway Startup Fix to Dev Branch..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Stash any uncommitted changes
Write-Host "💾 Stashing any uncommitted changes..." -ForegroundColor Yellow
git stash push -m "Auto-stash before Railway startup fix"

# Switch to or create dev branch
Write-Host "🔄 Switching to dev branch..." -ForegroundColor Yellow
git checkout dev 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📝 Creating new dev branch..." -ForegroundColor Blue
    git checkout -b dev
}

# Pull latest changes from dev (if it exists remotely)
Write-Host "⬇️ Pulling latest dev changes..." -ForegroundColor Yellow
git pull origin dev 2>$null

# Add all Railway startup fix files
Write-Host "📦 Adding Railway startup fix files..." -ForegroundColor Yellow
git add railway-start.cjs
git add railway.json
git add nixpacks.toml
git add package.json
git add fix-railway-complete.cjs
git add fix-railway-startup.ps1
git add RAILWAY_STARTUP_FIX_COMPLETE.md
git add push-railway-startup-fix-to-dev.ps1

# Check what files are staged
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git diff --cached --name-only

# Commit the changes
Write-Host "💾 Committing Railway startup fixes..." -ForegroundColor Green
git commit -m "Fix Railway startup script path and module issues"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

# Push to dev branch
Write-Host "🚀 Pushing to dev branch..." -ForegroundColor Green
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed Railway startup fixes to dev branch!" -ForegroundColor Green
    Write-Host "🔗 Branch: dev" -ForegroundColor Cyan
    Write-Host "📝 Commit message: Fix Railway startup script path and module issues" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "💡 You may need to set up the remote branch first:" -ForegroundColor Yellow
    Write-Host "   git push -u origin dev" -ForegroundColor White
    exit 1
}

# Show current status
Write-Host "" -ForegroundColor White
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
git status --short

Write-Host "" -ForegroundColor White
Write-Host "🎉 Railway startup fix deployment to dev branch complete!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the dev branch deployment" -ForegroundColor White
Write-Host "   2. Create a pull request to merge dev to main" -ForegroundColor White
Write-Host "   3. Deploy to Railway from main branch" -ForegroundColor White