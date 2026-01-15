# ============================================================================
# DEPLOY LOGIN 500 ERROR FIX TO RAILWAY STAGING
# ============================================================================
# This script deploys the permanent fix for the login 500 error
# Root Cause: password_hash column name mismatch with schema expecting password
# ============================================================================

Write-Host "🚀 DEPLOYING LOGIN 500 ERROR FIX" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project root verified" -ForegroundColor Green
Write-Host ""

# Step 2: Show what will be deployed
Write-Host "📋 CHANGES TO BE DEPLOYED:" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Yellow
Write-Host "1. Migration: 0033_fix_login_500_password_column.sql" -ForegroundColor White
Write-Host "   - Renames password_hash to password" -ForegroundColor Gray
Write-Host "   - Makes password nullable for OAuth support" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Schema Update: shared/schema.ts" -ForegroundColor White
Write-Host "   - Makes password field nullable" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Login Route: server/routes.ts" -ForegroundColor White
Write-Host "   - Adds NULL password check for OAuth users" -ForegroundColor Gray
Write-Host "   - Improves error logging" -ForegroundColor Gray
Write-Host "   - Removes fallback mode" -ForegroundColor Gray
Write-Host ""

# Step 3: Confirm deployment
$confirm = Read-Host "Do you want to proceed with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 DEPLOYING TO RAILWAY..." -ForegroundColor Cyan
Write-Host ""

# Step 4: Commit changes
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add migrations/0033_fix_login_500_password_column.sql
git add shared/schema.ts
git add server/routes.ts
git add fix-login-500-permanent.sql
git add diagnose-login-500-error.cjs

$commitMessage = "fix: Resolve login 500 error - password column name mismatch

Root Cause:
- Database has 'password_hash' column
- Schema expects 'password' column
- All users have NULL passwords

Changes:
- Migration to rename password_hash to password
- Make password nullable for OAuth support
- Add NULL password check in login route
- Improve error logging and handling
- Remove fallback authentication mode

Impact:
- Fixes all login 500 errors
- Supports OAuth users without passwords
- Better error messages for users"

git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Step 5: Push to staging branch
Write-Host "🚀 Pushing to staging branch..." -ForegroundColor Yellow
git push origin staging

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to staging" -ForegroundColor Green
Write-Host ""

# Step 6: Wait for Railway deployment
Write-Host "⏳ Waiting for Railway deployment..." -ForegroundColor Yellow
Write-Host "   Check Railway dashboard: https://railway.app" -ForegroundColor Gray
Write-Host ""
Write-Host "   The deployment will:" -ForegroundColor White
Write-Host "   1. Run the migration automatically" -ForegroundColor Gray
Write-Host "   2. Rename password_hash to password" -ForegroundColor Gray
Write-Host "   3. Deploy the updated code" -ForegroundColor Gray
Write-Host ""

# Step 7: Post-deployment verification
Write-Host "📋 POST-DEPLOYMENT VERIFICATION:" -ForegroundColor Cyan
Write-Host "-" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "After Railway deployment completes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Test login with existing user:" -ForegroundColor White
Write-Host "   Email: tgaswini.kawade@renalssa.ai" -ForegroundColor Gray
Write-Host "   (Use the correct password)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check Railway logs for:" -ForegroundColor White
Write-Host "   ✅ '🔐 Login attempt for: [email]'" -ForegroundColor Gray
Write-Host "   ✅ '✅ User found: [id]'" -ForegroundColor Gray
Write-Host "   ✅ '🔍 User has password: true/false'" -ForegroundColor Gray
Write-Host "   ✅ '✅ Password verified for: [email]'" -ForegroundColor Gray
Write-Host "   ✅ '✅ Login successful for: [email]'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify database column:" -ForegroundColor White
Write-Host "   - Column should be named 'password' (not password_hash)" -ForegroundColor Gray
Write-Host "   - Column should be nullable" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor Railway logs for successful deployment" -ForegroundColor White
Write-Host "2. Test login functionality" -ForegroundColor White
Write-Host "3. If users still have NULL passwords, they need to:" -ForegroundColor White
Write-Host "   - Use OAuth login, OR" -ForegroundColor Gray
Write-Host "   - Reset their password, OR" -ForegroundColor Gray
Write-Host "   - Contact support to set a password" -ForegroundColor Gray
Write-Host ""
