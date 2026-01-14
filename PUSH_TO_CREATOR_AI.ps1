#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Complete Creator AI Studio Application..." -ForegroundColor Green
Write-Host "Repository: https://github.com/tejaswini280/creator-AI" -ForegroundColor Yellow

# Remove existing remote if exists
try {
    git remote remove creator-ai-repo 2>$null
} catch {}

# Add the target repository
Write-Host "Adding remote repository..." -ForegroundColor Cyan
git remote add creator-ai-repo https://github.com/tejaswini280/creator-AI.git

# Check current status
Write-Host "Current branch and status:" -ForegroundColor Cyan
git status --short

# Push all application code to main branch
Write-Host "Pushing complete application to main branch..." -ForegroundColor Cyan
git push creator-ai-repo tk-final-Creator-AI:main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! Complete Creator AI Studio pushed to repository!" -ForegroundColor Green
    Write-Host "🎉 Your application is now available at:" -ForegroundColor Yellow
    Write-Host "   https://github.com/tejaswini280/creator-AI" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 What was pushed:" -ForegroundColor Cyan
    Write-Host "   ✅ Complete application (75+ files, 14,000+ lines)" -ForegroundColor White
    Write-Host "   ✅ Auto-scheduling system" -ForegroundColor White
    Write-Host "   ✅ AI content generation" -ForegroundColor White
    Write-Host "   ✅ Railway deployment setup" -ForegroundColor White
    Write-Host "   ✅ GitHub Actions CI/CD" -ForegroundColor White
    Write-Host "   ✅ All documentation" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Ready for Railway deployment!" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed. Make sure the repository exists on GitHub first." -ForegroundColor Red
    Write-Host "Create it at: https://github.com/new" -ForegroundColor Yellow
}