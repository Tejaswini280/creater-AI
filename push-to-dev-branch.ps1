#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Railway Fixes to Dev Branch..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host "Branch: dev" -ForegroundColor Cyan

# Check current status
Write-Host "`n📊 Current Git Status:" -ForegroundColor Cyan
git status --short

Write-Host "`n📈 Commits to Push:" -ForegroundColor Cyan
try {
    $ahead = git rev-list --count origin/dev..HEAD
    Write-Host "Commits ahead of origin/dev: $ahead" -ForegroundColor White
} catch {
    Write-Host "Could not determine commit count" -ForegroundColor Yellow
}

# Show what we're pushing
Write-Host "`n📁 Key Files Being Pushed:" -ForegroundColor Cyan
Write-Host "  ✅ railway-startup-immediate.cjs (CRITICAL - fixes Railway error)" -ForegroundColor Green
Write-Host "  ✅ package.json (clean configuration)" -ForegroundColor White
Write-Host "  ✅ railway.json (updated start command)" -ForegroundColor White
Write-Host "  ✅ Complete Railway fix documentation" -ForegroundColor White

Write-Host "`n🔧 Attempting Multiple Push Methods..." -ForegroundColor Cyan

# Method 1: Direct push to origin
Write-Host "`n1️⃣ Trying: git push origin dev" -ForegroundColor Yellow
try {
    git push origin dev
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Pushed to origin/dev" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Method 1 failed" -ForegroundColor Red
}

# Method 2: Push with explicit URL
Write-Host "`n2️⃣ Trying: git push with explicit URL" -ForegroundColor Yellow
try {
    git push https://github.com/Tejaswini280/creater-AI.git dev
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Pushed with explicit URL" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Method 2 failed" -ForegroundColor Red
}

# Method 3: Force push (if needed)
Write-Host "`n3️⃣ Trying: Force push (if safe)" -ForegroundColor Yellow
try {
    git push origin dev --force-with-lease
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Force pushed safely" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Method 3 failed" -ForegroundColor Red
}

# All methods failed
Write-Host "`n❌ All push methods failed!" -ForegroundColor Red
Write-Host "`n🔍 Diagnosis:" -ForegroundColor Yellow
Write-Host "  - Permission denied for user: tejaswinikawade280603" -ForegroundColor White
Write-Host "  - Repository: Tejaswini280/creater-AI.git" -ForegroundColor White
Write-Host "  - This appears to be a GitHub authentication issue" -ForegroundColor White

Write-Host "`n💡 Solutions:" -ForegroundColor Cyan
Write-Host "  1. Manual GitHub Upload (RECOMMENDED):" -ForegroundColor Green
Write-Host "     - Go to: https://github.com/Tejaswini280/creater-AI" -ForegroundColor White
Write-Host "     - Switch to dev branch" -ForegroundColor White
Write-Host "     - Upload railway-startup-immediate.cjs manually" -ForegroundColor White
Write-Host ""
Write-Host "  2. Fix GitHub Authentication:" -ForegroundColor Green
Write-Host "     - Generate Personal Access Token on GitHub" -ForegroundColor White
Write-Host "     - Use: git config credential.helper store" -ForegroundColor White
Write-Host "     - Try push again with token as password" -ForegroundColor White
Write-Host ""
Write-Host "  3. Use GitHub Desktop:" -ForegroundColor Green
Write-Host "     - Open GitHub Desktop" -ForegroundColor White
Write-Host "     - Select repository and push changes" -ForegroundColor White

Write-Host "`n🚨 URGENT: Railway needs railway-startup-immediate.cjs to work!" -ForegroundColor Red
Write-Host "📋 File content is in: COMPLETE_RAILWAY_FIX_BUNDLE.md" -ForegroundColor Yellow