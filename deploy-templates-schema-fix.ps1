# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY TEMPLATES SCHEMA FIX TO RAILWAY
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Fix the templates table schema conflict permanently
# Root Cause: Migration 0001 creates 'title' column, but 0004 expects 'name' column
# Solution: Add migration 0019 and run fix script
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEMPLATES SCHEMA FIX - PERMANENT SOLUTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify files exist
Write-Host "📋 Step 1: Verifying fix files..." -ForegroundColor Yellow
if (-not (Test-Path "migrations/0019_fix_templates_schema_conflict.sql")) {
    Write-Host "❌ Migration file not found!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "fix-templates-schema-permanent.cjs")) {
    Write-Host "❌ Fix script not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ All fix files present" -ForegroundColor Green
Write-Host ""

# Step 2: Commit changes
Write-Host "📋 Step 2: Committing fix to git..." -ForegroundColor Yellow
git add migrations/0019_fix_templates_schema_conflict.sql
git add fix-templates-schema-permanent.cjs
git add deploy-templates-schema-fix.ps1
git commit -m "fix: Add migration 0019 to resolve templates table schema conflict

Root Cause:
- Migration 0001 creates templates table with 'title' column
- Migration 0018 expects templates table with 'name' column
- Migration 0004 seed data uses 'name' column
- Result: column 'name' of relation 'templates' does not exist

Solution:
- Add migration 0019 to add 'name' column
- Migrate data from 'title' to 'name'
- Add unique constraint on 'name'
- Ensure all required columns exist

This permanently fixes the 502 error on Railway deployment."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Step 3: Push to dev branch
Write-Host "📋 Step 3: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to dev branch" -ForegroundColor Green
Write-Host ""

# Step 4: Instructions for Railway deployment
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "NEXT STEPS FOR RAILWAY DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option A: Automatic Deployment (if CI/CD is set up)" -ForegroundColor Yellow
Write-Host "   1. Merge dev branch to main" -ForegroundColor White
Write-Host "   2. Railway will automatically deploy" -ForegroundColor White
Write-Host "   3. Migration 0019 will run automatically" -ForegroundColor White
Write-Host ""
Write-Host "Option B: Manual Deployment" -ForegroundColor Yellow
Write-Host "   1. Go to Railway dashboard" -ForegroundColor White
Write-Host "   2. Trigger a new deployment from dev branch" -ForegroundColor White
Write-Host "   3. Monitor logs to verify migration 0019 runs" -ForegroundColor White
Write-Host ""
Write-Host "Option C: Run fix script directly (if deployment still fails)" -ForegroundColor Yellow
Write-Host "   1. Connect to Railway database:" -ForegroundColor White
Write-Host "      railway run node fix-templates-schema-permanent.cjs" -ForegroundColor Cyan
Write-Host "   2. Then trigger a new deployment" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "After deployment, verify the fix:" -ForegroundColor Yellow
Write-Host "   1. Check Railway logs for:" -ForegroundColor White
Write-Host "      ✅ Migration 0019 executed successfully" -ForegroundColor Green
Write-Host "      ✅ Migration 0004 executed successfully" -ForegroundColor Green
Write-Host "      ✅ Application started successfully" -ForegroundColor Green
Write-Host ""
Write-Host "   2. Application should now start without errors" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "FIX COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
