#!/usr/bin/env pwsh

Write-Host "🚀 Pushing tk-personal branch to creator-AI repository..." -ForegroundColor Green

# Remove existing remote if exists
try {
    git remote remove personal-repo 2>$null
} catch {}

# Add the repository
git remote add personal-repo https://github.com/tejaswini280/creator-AI.git

# Push tk-personal branch
git push personal-repo tk-personal --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! tk-personal branch pushed!" -ForegroundColor Green
    Write-Host "🎉 Repository: https://github.com/tejaswini280/creator-AI" -ForegroundColor Yellow
    Write-Host "📦 Branch: tk-personal" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed. Create repository first." -ForegroundColor Red
}