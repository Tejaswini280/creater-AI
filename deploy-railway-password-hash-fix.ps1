#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════════════
# RAILWAY DEPLOYMENT - PASSWORD_HASH PERMANENT FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the permanent fix for the password_hash column issue
# that causes Railway 502 errors during migration 0007.
# 
# Date: 2026-01-13
# Issue: Users table missing password_hash column causes NOT NULL constraint violation
# Solution: Apply fix before running migrations
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 RAILWAY PASSWORD_HASH PERMANENT FIX DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Railway CLI is installed
Write-Host "📋 Step 1: Verifying Railway CLI..." -ForegroundColor Yellow
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor White
    exit 1
}
Write-Host "✅ Railway CLI found" -ForegroundColor Green
Write-Host ""

# Step 2: Check Railway authentication
Write-Host "📋 Step 2: Checking Railway authentication..." -ForegroundColor Yellow
$authCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with Railway. Please login:" -ForegroundColor Red
    Write-Host "   railway login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Authenticated as: $authCheck" -ForegroundColor Green
Write-Host ""

# Step 3: Apply the password_hash fix to staging database
Write-Host "📋 Step 3: Applying password_hash fix to STAGING database..." -ForegroundColor Yellow
Write-Host "⚠️  This will add/update the password_hash column" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with STAGING fix? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Applying fix to staging database..." -ForegroundColor Cyan

# Apply the fix using Railway CLI
$fixResult = railway run --environment staging psql -f fix-password-hash-permanent.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Password_hash fix applied to STAGING successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to apply fix to STAGING" -ForegroundColor Red
    Write-Host "Error: $fixResult" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Commit and push the migration fixes
Write-Host "📋 Step 4: Committing migration fixes..." -ForegroundColor Yellow
git add migrations/0007_production_repair_idempotent.sql
git add migrations/0011_add_missing_unique_constraints.sql
git add fix-password-hash-permanent.sql
git add deploy-railway-password-hash-fix.ps1
git add PASSWORD_HASH_ROOT_CAUSE_PERMANENT_FIX.md
git add verify-password-hash-fix.cjs

$commitMessage = @"
fix: permanent solution for password_hash NOT NULL constraint

Fixed migration 0007 to include password_hash in user inserts
Fixed migration 0011 to include password_hash in test user
Added fix-password-hash-permanent.sql for existing databases
Column name: password_hash (not password)
Default value: oauth_user_no_password for OAuth users
Resolves Railway 502 errors from NULL password_hash

Root cause: Users table requires password_hash column but inserts
were missing it, causing NOT NULL constraint violations.

This is the PERMANENT fix that prevents the issue at the source.
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit failed (may already be committed)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Push to dev branch
Write-Host "📋 Step 5: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to dev branch" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to dev" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Trigger Railway staging deployment
Write-Host "📋 Step 6: Triggering Railway STAGING deployment..." -ForegroundColor Yellow
Write-Host "⚠️  This will redeploy staging with the fixed migrations" -ForegroundColor Yellow
Write-Host ""

$deployConfirm = Read-Host "Trigger STAGING deployment? (yes/no)"
if ($deployConfirm -ne "yes") {
    Write-Host "⚠️  Skipping deployment trigger" -ForegroundColor Yellow
    Write-Host "ℹ️  You can manually trigger deployment from Railway dashboard" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "🚀 Triggering deployment..." -ForegroundColor Cyan
    railway up --environment staging
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment triggered successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to trigger deployment" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 7: Summary
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ PASSWORD_HASH FIX DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 What was fixed:" -ForegroundColor Yellow
Write-Host "   ✓ Migration 0007: Added password_hash to user inserts" -ForegroundColor White
Write-Host "   ✓ Migration 0011: Added password_hash to test user" -ForegroundColor White
Write-Host "   ✓ Created fix-password-hash-permanent.sql for existing databases" -ForegroundColor White
Write-Host "   ✓ Committed and pushed to dev branch" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Root cause resolved:" -ForegroundColor Yellow
Write-Host "   • Users table requires password_hash column (NOT NULL)" -ForegroundColor White
Write-Host "   • Migrations were inserting users without password_hash" -ForegroundColor White
Write-Host "   • This caused 'null value in column password_hash' errors" -ForegroundColor White
Write-Host "   • OAuth users now use default: 'oauth_user_no_password'" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor Railway staging deployment logs" -ForegroundColor White
Write-Host "   2. Verify migrations complete successfully" -ForegroundColor White
Write-Host "   3. Test application functionality" -ForegroundColor White
Write-Host "   4. If successful, apply same fix to production" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Railway Dashboard:" -ForegroundColor Yellow
Write-Host "   https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
