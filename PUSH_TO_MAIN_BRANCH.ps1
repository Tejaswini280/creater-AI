#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Complete Creator AI Studio to Main Branch..." -ForegroundColor Green

# Remove existing remote if exists
try {
    git remote remove creator-ai-main 2>$null
} catch {}

# Add the repository
Write-Host "Adding repository remote..." -ForegroundColor Cyan
git remote add creator-ai-main https://github.com/tejaswini280/creator-AI.git

# Push current branch to main branch with force
Write-Host "Pushing to main branch..." -ForegroundColor Cyan
git push creator-ai-main tk-final-Creator-AI:main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! Complete Creator AI Studio pushed to main branch!" -ForegroundColor Green
    Write-Host "🎉 Repository: https://github.com/tejaswini280/creator-AI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📦 What was pushed to main branch:" -ForegroundColor Cyan
    Write-Host "   ✅ Complete application (75+ files)" -ForegroundColor White
    Write-Host "   ✅ Auto-scheduling system" -ForegroundColor White
    Write-Host "   ✅ AI content generation" -ForegroundColor White
    Write-Host "   ✅ Railway deployment setup" -ForegroundColor White
    Write-Host "   ✅ GitHub Actions CI/CD" -ForegroundColor White
    Write-Host "   ✅ All documentation" -ForegroundColor White
} else {
    Write-Host "❌ Push failed. Create repository first at:" -ForegroundColor Red
    Write-Host "https://github.com/new" -ForegroundColor Yellow
}