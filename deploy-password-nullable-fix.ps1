# ═══════════════════════════════════════════════════════════════════════════════
# PERMANENT FIX: Deploy password nullable fix to Railway
# ═══════════════════════════════════════════════════════════════════════════════
# This script:
# 1. Skips the problematic migration 0010
# 2. Applies the password nullable fix
# 3. Deploys to Railway
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING PASSWORD NULLABLE FIX TO RAILWAY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Apply the fix locally first (optional, for testing)
Write-Host "`n📋 Step 1: Testing fix locally..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Found .env file, testing locally first..." -ForegroundColor Green
    node skip-migration-0010-and-fix.cjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Local test failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Local test passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .env file found, skipping local test" -ForegroundColor Yellow
}

# Step 2: Commit changes
Write-Host "`n📋 Step 2: Committing changes..." -ForegroundColor Yellow
git add migrations/0023_fix_password_nullable_permanent.sql
git add skip-migration-0010-and-fix.cjs
git add fix-password-nullable-permanent.cjs
git add deploy-password-nullable-fix.ps1

git commit -m "fix: Make password column nullable for OAuth users (permanent fix)

- Skip problematic migration 0010
- Add migration 0023 to make password nullable
- Support OAuth/passwordless authentication
- Fix 502 error permanently"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nothing to commit or commit failed" -ForegroundColor Yellow
}

# Step 3: Push to dev branch
Write-Host "`n📋 Step 3: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to dev branch!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to dev branch successfully!" -ForegroundColor Green

# Step 4: Deploy to Railway staging
Write-Host "`n📋 Step 4: Deploying to Railway staging..." -ForegroundColor Yellow
Write-Host "⚠️  Railway will automatically deploy from the dev branch" -ForegroundColor Yellow
Write-Host "⚠️  The fix will be applied during deployment" -ForegroundColor Yellow

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT INITIATED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Monitor Railway deployment logs" -ForegroundColor White
Write-Host "2. Verify that migration 0010 is skipped" -ForegroundColor White
Write-Host "3. Verify that migration 0023 is applied" -ForegroundColor White
Write-Host "4. Verify that the application starts successfully" -ForegroundColor White
Write-Host "5. Test OAuth/passwordless authentication" -ForegroundColor White

Write-Host "`n🔗 Railway Dashboard:" -ForegroundColor Yellow
Write-Host "   https://railway.app/dashboard" -ForegroundColor Cyan

Write-Host "`n🎉 Deployment script completed!" -ForegroundColor Green
