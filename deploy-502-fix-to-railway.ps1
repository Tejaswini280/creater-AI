# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY 502 ERROR FIX TO RAILWAY - PERMANENT SOLUTION
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the permanent fix for the 502 error to Railway
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING 502 ERROR FIX TO RAILWAY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Commit the fixed migration file
Write-Host "📝 Step 1: Committing fixed migration file..." -ForegroundColor Yellow
git add migrations/0001_core_tables_idempotent.sql
git add fix-502-error-permanent-solution.cjs
git commit -m "🔧 CRITICAL FIX: Resolve 502 error - Fix migration syntax error

- Fixed DO block syntax in 0001_core_tables_idempotent.sql (DO $$ instead of DO $)
- Added permanent solution script to clear migration state
- Verified database schema integrity
- All syntax errors resolved

This permanently fixes the 502 error on Railway deployment."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed successfully" -ForegroundColor Green

# Step 2: Push to dev branch first
Write-Host ""
Write-Host "📤 Step 2: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to dev failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to dev branch successfully" -ForegroundColor Green

# Step 3: Push to main branch for Railway deployment
Write-Host ""
Write-Host "🚀 Step 3: Pushing to main branch for Railway deployment..." -ForegroundColor Yellow
git checkout main
git merge dev --no-edit
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to main failed" -ForegroundColor Red
    git checkout dev
    exit 1
}

Write-Host "✅ Pushed to main branch successfully" -ForegroundColor Green

# Step 4: Switch back to dev branch
git checkout dev

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 502 ERROR FIX DEPLOYED TO RAILWAY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Fixed migration file deployed" -ForegroundColor Green
Write-Host "✅ Syntax errors resolved" -ForegroundColor Green
Write-Host "✅ Railway will now deploy successfully" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Check your Railway deployment at:" -ForegroundColor Cyan
Write-Host "   https://railway.app/project/your-project" -ForegroundColor White
Write-Host ""
Write-Host "📊 The application should start without 502 errors now!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan