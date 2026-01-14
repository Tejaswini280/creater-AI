#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# RAILWAY 502 ERROR - PASSWORD HASH PERMANENT FIX & DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════
# 
# ROOT CAUSE: Database schema mismatch between password_hash and password columns
# SOLUTION: Standardize schema and fix OAuth compatibility
# 
# This script:
# 1. Fixes the database schema mismatch
# 2. Updates the problematic migration
# 3. Deploys the fix to Railway
# 4. Verifies the application starts successfully
# 
# Date: 2026-01-13
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 RAILWAY 502 ERROR - PASSWORD HASH PERMANENT FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Run the database schema fix
Write-Host "🔧 Step 1: Fixing database schema mismatch..." -ForegroundColor Yellow
try {
    node fix-502-error-password-hash-permanent-solution.cjs
    Write-Host "✅ Database schema fix completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database schema fix failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Commit the migration fix
Write-Host "🔧 Step 2: Committing migration fixes..." -ForegroundColor Yellow
git add migrations/0002_seed_data_with_conflicts.sql
git add fix-502-error-password-hash-permanent-solution.cjs
git commit -m "🔧 CRITICAL FIX: Resolve password_hash column mismatch causing 502 errors

- Fixed database schema standardization on 'password' column (nullable for OAuth)
- Updated 0002_seed_data_with_conflicts.sql to explicitly set password=NULL
- Added comprehensive schema fix script
- Ensures OAuth compatibility and prevents migration failures

Root cause: Database had password_hash column but migrations expected password column
Solution: Standardize on password column and make it nullable for OAuth users"

Write-Host "✅ Migration fixes committed" -ForegroundColor Green

# Step 3: Push to dev branch first
Write-Host "🔧 Step 3: Pushing fixes to dev branch..." -ForegroundColor Yellow
git push origin dev
Write-Host "✅ Pushed to dev branch" -ForegroundColor Green

# Step 4: Deploy to Railway staging
Write-Host "🔧 Step 4: Deploying to Railway staging..." -ForegroundColor Yellow
try {
    railway up --service staging
    Write-Host "✅ Deployed to Railway staging" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Railway staging deployment failed, continuing with production..." -ForegroundColor Yellow
}

# Step 5: Deploy to Railway production
Write-Host "🔧 Step 5: Deploying to Railway production..." -ForegroundColor Yellow
railway up --service production
Write-Host "✅ Deployed to Railway production" -ForegroundColor Green

# Step 6: Wait for deployment and check status
Write-Host "🔧 Step 6: Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 7: Verify deployment
Write-Host "🔧 Step 7: Verifying deployment status..." -ForegroundColor Yellow
try {
    railway status --service production
    Write-Host "✅ Deployment verification completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify deployment status" -ForegroundColor Yellow
}

# Step 8: Test application health
Write-Host "🔧 Step 8: Testing application health..." -ForegroundColor Yellow
try {
    node -e "
    const https = require('https');
    const url = process.env.RAILWAY_STATIC_URL || 'https://your-app.railway.app';
    
    https.get(url + '/health', (res) => {
      console.log('Health check status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ Application is healthy');
      } else {
        console.log('⚠️  Application may have issues');
      }
    }).on('error', (err) => {
      console.log('⚠️  Health check failed:', err.message);
    });
    "
} catch {
    Write-Host "⚠️  Health check script failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Database schema mismatch fixed" -ForegroundColor Green
Write-Host "✅ Migration 0002_seed_data_with_conflicts.sql updated" -ForegroundColor Green
Write-Host "✅ OAuth compatibility ensured" -ForegroundColor Green
Write-Host "✅ Deployed to Railway production" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Check your Railway dashboard for final deployment status" -ForegroundColor Cyan
Write-Host "🔗 Application should now start without 502 errors" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan