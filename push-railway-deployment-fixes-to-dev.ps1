#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Railway Deployment Fixes to Dev Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host "Branch: dev" -ForegroundColor Cyan

# Check if we're on the right branch
$currentBranch = git branch --show-current
Write-Host "`n📍 Current branch: $currentBranch" -ForegroundColor White

if ($currentBranch -ne "dev") {
    Write-Host "⚠️ Not on dev branch. Switching to dev..." -ForegroundColor Yellow
    git checkout dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to dev branch" -ForegroundColor Red
        exit 1
    }
}

# Add all Railway deployment fixes
Write-Host "`n📦 Adding Railway deployment fixes..." -ForegroundColor Cyan

$railwayFiles = @(
    "railway-start.cjs",
    "railway-startup-fallback.cjs", 
    "railway-direct-start.cjs",
    "railway-env-check.cjs",
    "railway-verify-deployment.cjs",
    "test-railway-startup.cjs",
    "fix-railway-deployment-complete.cjs",
    "RAILWAY_DEPLOYMENT_COMPLETE_FIX_SUMMARY.md",
    "package.json",
    "railway.json",
    "nixpacks.toml"
)

foreach ($file in $railwayFiles) {
    if (Test-Path $file) {
        git add $file
        Write-Host "  ✅ Added: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Missing: $file" -ForegroundColor Yellow
    }
}

# Check current status
Write-Host "`n📊 Current Git Status:" -ForegroundColor Cyan
git status --short

# Commit the changes
Write-Host "`n💾 Committing Railway deployment fixes..." -ForegroundColor Cyan
$commitMessage = "fix: Complete Railway deployment fixes - Fixed module resolution error - Updated Node.js version compatibility - Added multiple startup methods with fallbacks"

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed successfully" -ForegroundColor Green

# Show what we're pushing
Write-Host "`n📁 Railway Deployment Fixes Summary:" -ForegroundColor Cyan
Write-Host "  🔧 railway-start.cjs - Multi-method startup script" -ForegroundColor Green
Write-Host "  🔧 railway-startup-fallback.cjs - Emergency fallback" -ForegroundColor Green
Write-Host "  🔧 package.json - Updated with new startup options" -ForegroundColor Green
Write-Host "  🔧 railway.json - Cascading startup commands" -ForegroundColor Green
Write-Host "  🔧 nixpacks.toml - Node.js 22 compatibility" -ForegroundColor Green

Write-Host "`n🔧 Attempting Push to Dev Branch..." -ForegroundColor Cyan

# Method 1: Standard push
Write-Host "`n1️⃣ Trying: git push origin dev" -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 SUCCESS! Railway deployment fixes pushed to dev branch!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy to Railway from dev branch" -ForegroundColor White
    Write-Host "  2. Railway will use the new startup configuration" -ForegroundColor White
    Write-Host "  3. Monitor Railway logs for successful startup" -ForegroundColor White
    exit 0
}

# Method 2: Push with explicit URL
Write-Host "`n2️⃣ Trying: git push with explicit URL" -ForegroundColor Yellow
git push https://github.com/Tejaswini280/creater-AI.git dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 SUCCESS! Railway deployment fixes pushed!" -ForegroundColor Green
    exit 0
}

# All methods failed
Write-Host "`n❌ Push failed - Manual upload required" -ForegroundColor Red
Write-Host "`n💡 Manual Upload Instructions:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://github.com/Tejaswini280/creater-AI" -ForegroundColor White
Write-Host "  2. Switch to 'dev' branch" -ForegroundColor White
Write-Host "  3. Upload railway-start.cjs (CRITICAL)" -ForegroundColor Green
Write-Host "  4. Upload other Railway files" -ForegroundColor White