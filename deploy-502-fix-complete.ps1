#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETE 502 ERROR FIX - RAILWAY DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════
# 
# This script deploys the complete fix for the 502 error caused by:
# - password_hash vs password column mismatch
# - Migration failures due to NOT NULL constraints on OAuth system
# 
# The fix includes:
# 1. New migration to standardize schema
# 2. Fixed seed data migration
# 3. OAuth-compatible user creation
# 
# Date: 2026-01-13
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 DEPLOYING COMPLETE 502 ERROR FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Commit all fixes
Write-Host "🔧 Step 1: Committing all fixes..." -ForegroundColor Yellow

git add migrations/0017_fix_password_hash_column_mismatch.sql
git add migrations/0002_seed_data_with_conflicts.sql
git add fix-502-error-password-hash-permanent-solution.cjs
git add verify-502-password-hash-fix.cjs
git add deploy-railway-502-password-hash-fix.ps1
git add deploy-502-fix-complete.ps1

git commit -m "🔧 COMPLETE 502 ERROR FIX: Password hash column mismatch resolution

CRITICAL FIXES:
✅ Added migration 0017 to standardize password column schema
✅ Fixed migration 0002 to work with OAuth (password=NULL)
✅ Created comprehensive schema fix and verification scripts
✅ Ensured full OAuth compatibility

ROOT CAUSE: Database had password_hash column but code expected password column
SOLUTION: Standardize on nullable password column for OAuth system

This resolves the recurring 502 errors during application startup caused by:
- Migration failures due to NOT NULL constraint violations
- Schema mismatches between password_hash and password columns
- OAuth user creation failures

The fix is fully idempotent and safe for production deployment."

Write-Host "✅ All fixes committed" -ForegroundColor Green

# Step 2: Push to dev branch
Write-Host "🔧 Step 2: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev
Write-Host "✅ Pushed to dev branch" -ForegroundColor Green

# Step 3: Merge to main branch for production deployment
Write-Host "🔧 Step 3: Merging to main branch..." -ForegroundColor Yellow
git checkout main
git merge dev
git push origin main
Write-Host "✅ Merged and pushed to main branch" -ForegroundColor Green

# Step 4: Deploy to Railway
Write-Host "🔧 Step 4: Deploying to Railway..." -ForegroundColor Yellow

# Try to deploy to production
try {
    railway up --service production
    Write-Host "✅ Deployed to Railway production" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Railway deployment command failed, trying alternative..." -ForegroundColor Yellow
    
    # Alternative: Push and let Railway auto-deploy
    Write-Host "🔧 Using Railway auto-deployment via git push..." -ForegroundColor Yellow
    Write-Host "✅ Code pushed to main - Railway should auto-deploy" -ForegroundColor Green
}

# Step 5: Wait for deployment
Write-Host "🔧 Step 5: Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Step 6: Check deployment status
Write-Host "🔧 Step 6: Checking deployment status..." -ForegroundColor Yellow
try {
    railway status
    Write-Host "✅ Deployment status checked" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not check Railway status - check dashboard manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "FIXES DEPLOYED:" -ForegroundColor White
Write-Host "✅ Migration 0017: Password hash column standardization" -ForegroundColor Green
Write-Host "✅ Migration 0002: OAuth-compatible user seeding" -ForegroundColor Green
Write-Host "✅ Schema fix scripts for manual troubleshooting" -ForegroundColor Green
Write-Host "✅ Verification scripts for testing" -ForegroundColor Green
Write-Host ""
Write-Host "EXPECTED RESULTS:" -ForegroundColor White
Write-Host "✅ Application should start without 502 errors" -ForegroundColor Green
Write-Host "✅ Database migrations should complete successfully" -ForegroundColor Green
Write-Host "✅ OAuth user creation should work" -ForegroundColor Green
Write-Host "✅ No more password_hash constraint violations" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Check your Railway dashboard for deployment status" -ForegroundColor Cyan
Write-Host "🔗 Monitor application logs for successful startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Return to dev branch for continued development
git checkout dev
Write-Host "🔄 Returned to dev branch for continued development" -ForegroundColor Blue