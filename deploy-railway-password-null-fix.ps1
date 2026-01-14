# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY PASSWORD HASH NULL CONSTRAINT FIX TO RAILWAY
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the fix for the password_hash NULL constraint issue
# that's causing Railway 502 errors with OAuth users.
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYING PASSWORD HASH NULL CONSTRAINT FIX TO RAILWAY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Commit the fix
Write-Host "📝 Step 1: Committing password hash NULL constraint fix..." -ForegroundColor Yellow
git add migrations/0018_fix_password_hash_null_constraint.sql
git add migrations/0010_railway_production_schema_repair_final.sql
git add deploy-railway-password-null-fix.ps1
git add verify-password-null-fix.cjs
git add PASSWORD_HASH_NULL_CONSTRAINT_FIX_COMPLETE.md
git commit -m "fix: Allow NULL password_hash for OAuth users to fix Railway 502 error"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Push to dev branch
Write-Host "📤 Step 2: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to dev failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to dev successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Merge to main
Write-Host "🔀 Step 3: Merging dev to main..." -ForegroundColor Yellow
git checkout main
git pull origin main
git merge dev -m "Merge password hash NULL constraint fix from dev"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Merge to main failed" -ForegroundColor Red
    git checkout dev
    exit 1
}

Write-Host "✅ Merged to main successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Push to main (triggers Railway deployment)
Write-Host "🚀 Step 4: Pushing to main (triggers Railway deployment)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to main failed" -ForegroundColor Red
    git checkout dev
    exit 1
}

Write-Host "✅ Pushed to main successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Return to dev branch
Write-Host "🔄 Step 5: Returning to dev branch..." -ForegroundColor Yellow
git checkout dev

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ PASSWORD HASH NULL CONSTRAINT FIX DEPLOYED SUCCESSFULLY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was fixed:" -ForegroundColor Cyan
Write-Host "   ✅ Removed NOT NULL constraint from password column" -ForegroundColor White
Write-Host "   ✅ OAuth users can now have NULL password_hash" -ForegroundColor White
Write-Host "   ✅ Migration 0010 updated to be OAuth-compatible" -ForegroundColor White
Write-Host "   ✅ Migration 0018 created to fix existing databases" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Railway deployment triggered automatically" -ForegroundColor Cyan
Write-Host "   Monitor at: https://railway.app/project/creator-dev-server" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Expected deployment time: 3-5 minutes" -ForegroundColor Yellow
Write-Host ""
