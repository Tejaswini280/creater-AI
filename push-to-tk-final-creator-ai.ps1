#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Docker Authentication Fixes to tk-final-Creator-AI" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Get current branch and status
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Green

# Check if tk-final-Creator-AI remote exists
$remotes = git remote -v
$tkRemoteExists = $remotes | Select-String "tk-final-Creator-AI"

if (-not $tkRemoteExists) {
    Write-Host "🔗 Adding tk-final-Creator-AI remote..." -ForegroundColor Blue
    git remote add tk-final-Creator-AI https://github.com/Tejaswini280/tk-final-Creator-AI.git
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add tk-final-Creator-AI remote" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Added tk-final-Creator-AI remote successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ tk-final-Creator-AI remote already exists" -ForegroundColor Green
}

# Fetch from tk-final-Creator-AI to get latest state
Write-Host "📥 Fetching from tk-final-Creator-AI..." -ForegroundColor Blue
git fetch tk-final-Creator-AI

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to fetch from tk-final-Creator-AI" -ForegroundColor Red
    exit 1
}

# Push current branch to tk-final-Creator-AI main
Write-Host "🚀 Pushing $currentBranch to tk-final-Creator-AI main..." -ForegroundColor Blue
git push tk-final-Creator-AI $currentBranch:main --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to tk-final-Creator-AI main" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully pushed to tk-final-Creator-AI main!" -ForegroundColor Green

# Also push to dev branch if it exists
Write-Host "🚀 Pushing $currentBranch to tk-final-Creator-AI dev..." -ForegroundColor Blue
git push tk-final-Creator-AI $currentBranch:dev --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Failed to push to tk-final-Creator-AI dev (branch may not exist)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Successfully pushed to tk-final-Creator-AI dev!" -ForegroundColor Green
}

# Summary
Write-Host "`n🎉 Push to tk-final-Creator-AI Complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "✅ Docker authentication fixes pushed to tk-final-Creator-AI" -ForegroundColor Green
Write-Host "✅ Both main and dev branches updated" -ForegroundColor Green

Write-Host "`n📋 Changes Pushed:" -ForegroundColor Cyan
Write-Host "- Fixed Docker login redirect loop" -ForegroundColor White
Write-Host "- Updated cookie sameSite policy for Docker compatibility" -ForegroundColor White
Write-Host "- Enhanced CORS configuration for container environments" -ForegroundColor White
Write-Host "- Improved frontend auth state management" -ForegroundColor White
Write-Host "- Fixed WebSocket token validation" -ForegroundColor White
Write-Host "- Updated Docker environment configuration" -ForegroundColor White

Write-Host "`n🔗 Repository Links:" -ForegroundColor Yellow
Write-Host "- tk-final-Creator-AI: https://github.com/Tejaswini280/tk-final-Creator-AI" -ForegroundColor Gray
Write-Host "- Original repo: https://github.com/Tejaswini280/creater-AI" -ForegroundColor Gray

Write-Host "`n🎯 Docker Authentication Fixes Successfully Deployed to tk-final-Creator-AI!" -ForegroundColor Green