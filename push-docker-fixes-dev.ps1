#!/usr/bin/env pwsh

Write-Host "🐳 Pushing Docker Build Fixes to Dev Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host "Branch: dev" -ForegroundColor Cyan

# Check current status
Write-Host "`n📊 Current Git Status:" -ForegroundColor Cyan
git status --short

# Add all Docker-related changes
Write-Host "`n📦 Adding Docker Build Fixes..." -ForegroundColor Cyan
git add Dockerfile
git add .dockerignore
git add package.json
git add fix-docker-build-issues.cjs
git add test-docker-build.cjs
git add DOCKER_BUILD_FIXES_COMPLETE.md

Write-Host "`n📁 Key Docker Fixes Being Pushed:" -ForegroundColor Cyan
Write-Host "  ✅ Dockerfile (Updated to Node 22 + build tools)" -ForegroundColor Green
Write-Host "  ✅ .dockerignore (Optimized for faster builds)" -ForegroundColor Green
Write-Host "  ✅ package.json (Node 22 engine requirement)" -ForegroundColor Green
Write-Host "  ✅ fix-docker-build-issues.cjs (Automated fix script)" -ForegroundColor White
Write-Host "  ✅ test-docker-build.cjs (Build validation script)" -ForegroundColor White
Write-Host "  ✅ DOCKER_BUILD_FIXES_COMPLETE.md (Complete documentation)" -ForegroundColor White

# Commit the changes
Write-Host "`n💾 Committing Docker Build Fixes..." -ForegroundColor Cyan
$commitMessage = "fix: Docker build issues - Node 22, build tools, optimized .dockerignore"

git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed successfully!" -ForegroundColor Green

# Method 1: Direct push to origin
Write-Host "`n🚀 Pushing to dev branch..." -ForegroundColor Yellow
try {
    git push origin dev
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Docker fixes pushed to origin/dev" -ForegroundColor Green
        Write-Host "`n🎉 Docker Build Issues Fixed and Deployed!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Push failed" -ForegroundColor Red
}

Write-Host "`n❌ Automated push failed!" -ForegroundColor Red
Write-Host "`n💡 Manual Upload Instructions:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://github.com/Tejaswini280/creater-AI" -ForegroundColor Green
Write-Host "  2. Switch to 'dev' branch" -ForegroundColor White
Write-Host "  3. Upload the key files manually" -ForegroundColor White
Write-Host "`n🚨 CRITICAL: These fixes resolve Railway deployment failures!" -ForegroundColor Red