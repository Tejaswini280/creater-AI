# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY 0002 MIGRATION FIX TO RAILWAY - PRODUCTION SAFE
# ═══════════════════════════════════════════════════════════════════════════════
# Deploys the corrected 0002 migration that handles password column properly
# Fixes the recurring 502 error caused by NOT NULL constraint violation
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 Deploying 0002 Migration Fix to Railway..." -ForegroundColor Green
Write-Host ""

# Step 1: Verify the fix locally first
Write-Host "📋 STEP 1: Verifying migration fix locally..." -ForegroundColor Yellow
if (Test-Path "verify-0002-migration-fix.cjs") {
    Write-Host "   Running local verification test..."
    node verify-0002-migration-fix.cjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Local verification failed - aborting deployment" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Local verification passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Verification script not found - proceeding with deployment" -ForegroundColor Yellow
}

# Step 2: Commit the migration fix
Write-Host ""
Write-Host "📝 STEP 2: Committing migration fix..." -ForegroundColor Yellow
git add migrations/0002_seed_data_with_conflicts.sql
git add verify-0002-migration-fix.cjs
git add deploy-0002-migration-fix.ps1
git commit -m "🔧 Fix 0002 migration password column handling

- Handle both password and password_hash column scenarios
- Fix NOT NULL constraint violation for OAuth users  
- Make migration fully idempotent and production-safe
- Add schema-aware user creation logic
- Resolves recurring 502 errors on Railway deployment

Fixes: Migration 0002 failing with password_hash NOT NULL violation"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}

# Step 3: Push to development branch first
Write-Host ""
Write-Host "🌿 STEP 3: Pushing to development branch..." -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to dev failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Pushed to dev branch successfully" -ForegroundColor Green

# Step 4: Deploy to Railway staging
Write-Host ""
Write-Host "🚂 STEP 4: Deploying to Railway staging..." -ForegroundColor Yellow
railway login
railway environment staging
railway up --detach

Write-Host ""
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 5: Verify deployment success
Write-Host ""
Write-Host "🔍 STEP 5: Verifying deployment..." -ForegroundColor Yellow
$deploymentStatus = railway status
Write-Host $deploymentStatus

if ($deploymentStatus -match "Deployed|Running") {
    Write-Host "   ✅ Deployment successful!" -ForegroundColor Green
    
    # Step 6: Check application logs
    Write-Host ""
    Write-Host "📋 STEP 6: Checking application logs..." -ForegroundColor Yellow
    railway logs --tail 50
    
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "   1. Monitor Railway logs for any migration errors"
    Write-Host "   2. Test the application endpoints"
    Write-Host "   3. If successful, deploy to production"
    Write-Host "   4. Run: railway environment production && railway up"
    Write-Host ""
    
} else {
    Write-Host "❌ Deployment may have failed - check Railway dashboard" -ForegroundColor Red
    Write-Host "   Run 'railway logs' to see detailed error messages" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 0002 Migration fix deployed successfully!" -ForegroundColor Green