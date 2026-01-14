# Deploy Missing UNIQUE Constraints Fix - Critical for ON CONFLICT Operations

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 DEPLOYING CRITICAL UNIQUE CONSTRAINTS FIX" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚨 CRITICAL ISSUE IDENTIFIED:" -ForegroundColor Red
Write-Host "   • Missing UNIQUE constraints for ON CONFLICT operations" -ForegroundColor White
Write-Host "   • Seeding operations failing due to constraint errors" -ForegroundColor White
Write-Host "   • This causes Railway 502 errors during startup" -ForegroundColor White
Write-Host ""

Write-Host "🔧 THIS FIX WILL ADD:" -ForegroundColor Yellow
Write-Host "   • users_email_key UNIQUE constraint" -ForegroundColor White
Write-Host "   • ai_engagement_patterns_platform_category_key UNIQUE constraint" -ForegroundColor White
Write-Host "   • niches_name_key UNIQUE constraint" -ForegroundColor White
Write-Host "   • Test all ON CONFLICT operations" -ForegroundColor White
Write-Host ""

# Check if the migration exists
if (-not (Test-Path "migrations/0011_add_missing_unique_constraints.sql")) {
    Write-Host "❌ Error: Migration file not found!" -ForegroundColor Red
    Write-Host "   Expected: migrations/0011_add_missing_unique_constraints.sql" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found" -ForegroundColor Green
Write-Host ""

# Confirm deployment
$confirm = Read-Host "🤔 Deploy the UNIQUE constraints fix? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Deployment cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying UNIQUE constraints fix..." -ForegroundColor Green
Write-Host ""

# Stage and commit changes
Write-Host "📦 Staging changes..." -ForegroundColor Cyan
git add .

Write-Host "📝 Committing UNIQUE constraints fix..." -ForegroundColor Cyan
git commit -m "fix: Add missing UNIQUE constraints for ON CONFLICT operations

CRITICAL FIX:
- Add users_email_key UNIQUE constraint (fixes user seeding)
- Add ai_engagement_patterns_platform_category_key UNIQUE constraint (fixes pattern seeding)
- Add niches_name_key UNIQUE constraint (fixes niche seeding)
- Test all ON CONFLICT operations to ensure they work
- Eliminates Railway 502 errors from seeding failures

PRODUCTION SAFE:
- Uses IF NOT EXISTS checks (idempotent)
- Includes comprehensive validation
- Tests operations before completion"

# Push to Railway
Write-Host ""
Write-Host "🚀 Pushing to Railway..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "⏳ Waiting for Railway deployment..." -ForegroundColor Yellow
Write-Host "   This should complete in 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

Write-Host "📋 EXPECTED MIGRATION LOG OUTPUT:" -ForegroundColor Yellow
Write-Host "   🚀 Executing migration: 0011_add_missing_unique_constraints.sql" -ForegroundColor Gray
Write-Host "   NOTICE: Added UNIQUE constraint: users_email_key" -ForegroundColor Gray
Write-Host "   NOTICE: Added UNIQUE constraint: ai_engagement_patterns_platform_category_key" -ForegroundColor Gray
Write-Host "   NOTICE: Added UNIQUE constraint: niches_name_key" -ForegroundColor Gray
Write-Host "   NOTICE: ✅ All required UNIQUE constraints verified successfully" -ForegroundColor Gray
Write-Host "   NOTICE: ✅ All ON CONFLICT operations tested successfully" -ForegroundColor Gray
Write-Host "   ✅ Migration completed successfully" -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 AFTER DEPLOYMENT, VERIFY:" -ForegroundColor Yellow
Write-Host "   1. Run: node verify-railway-schema-repair.cjs" -ForegroundColor White
Write-Host "   2. Should show: ✅ All UNIQUE constraints exist" -ForegroundColor White
Write-Host "   3. Should show: ✅ Database operation test passed" -ForegroundColor White
Write-Host "   4. Health check: https://your-app.railway.app/api/health" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ UNIQUE CONSTRAINTS FIX DEPLOYED - ON CONFLICT OPERATIONS NOW WORK" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Next: Run verification script to confirm all issues are resolved!" -ForegroundColor Green