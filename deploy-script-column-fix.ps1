# ═══════════════════════════════════════════════════════════════════════════════
# Deploy Script Column Fix to Railway
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the fix for the missing script column error
# Date: 2026-01-14
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYING SCRIPT COLUMN FIX TO RAILWAY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Verify we're on the correct branch
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "📋 Step 1: Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Current branch: $currentBranch" -ForegroundColor White

if ($currentBranch -ne "dev") {
    Write-Host "⚠️  Warning: Not on dev branch. Switching to dev..." -ForegroundColor Yellow
    git checkout dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to dev branch" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ On dev branch" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Stage and commit the fix
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "📋 Step 2: Staging migration files..." -ForegroundColor Yellow

git add migrations/0027_add_missing_script_column.sql
git add verify-script-column-fix.cjs
git add deploy-script-column-fix.ps1

Write-Host "✅ Files staged" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 3: Committing changes..." -ForegroundColor Yellow
git commit -m "fix: Add missing script column to content table - Fixes scheduler service PostgresError"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nothing to commit or commit failed" -ForegroundColor Yellow
    Write-Host "   Continuing with push..." -ForegroundColor White
}

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Push to dev branch
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "📋 Step 4: Pushing to dev branch..." -ForegroundColor Yellow

git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to dev branch" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Trigger Railway deployment
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "📋 Step 5: Triggering Railway deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Railway will automatically deploy from the dev branch" -ForegroundColor White
Write-Host "   The migration will run automatically on deployment" -ForegroundColor White
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Provide verification instructions
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT INITIATED" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Script column fix has been pushed to dev branch" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Monitor Railway deployment:" -ForegroundColor White
Write-Host "   - Go to Railway dashboard" -ForegroundColor Gray
Write-Host "   - Check deployment logs" -ForegroundColor Gray
Write-Host "   - Verify migration 0027 runs successfully" -ForegroundColor Gray
Write-Host ""
Write-Host "2. After deployment completes, verify the fix:" -ForegroundColor White
Write-Host "   node verify-script-column-fix.cjs" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Check scheduler service logs:" -ForegroundColor White
Write-Host "   - Look for: 'Content Scheduler Service initialized successfully'" -ForegroundColor Gray
Write-Host "   - Verify no 'column script does not exist' errors" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test scheduler functionality:" -ForegroundColor White
Write-Host "   - Create a new scheduled content item" -ForegroundColor Gray
Write-Host "   - Verify it appears in the scheduler" -ForegroundColor Gray
Write-Host "   - Check that existing schedules load correctly" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Migration: 0027_add_missing_script_column.sql" -ForegroundColor White
Write-Host "Purpose:   Fix missing script column in content table" -ForegroundColor White
Write-Host "Impact:    Resolves scheduler service initialization errors" -ForegroundColor White
Write-Host "Safety:    Uses IF NOT EXISTS - safe to run multiple times" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Deployment script completed successfully!" -ForegroundColor Green
Write-Host ""
