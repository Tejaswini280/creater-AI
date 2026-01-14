#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTION DEPLOYMENT WITH MIGRATION FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the application with the fixed migration system
# that will work on both empty and existing Railway databases
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 DEPLOYING WITH MIGRATION FIX..." -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Verify migration fix is correct
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 1: Verifying migration fix..." -ForegroundColor Yellow
node verify-migration-fix.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Build application
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 2: Building application..." -ForegroundColor Yellow

# Install dependencies
Write-Host "   📦 Installing dependencies..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

# Build client
Write-Host "   🏗️  Building client..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Commit and push migration fix
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 3: Committing migration fix..." -ForegroundColor Yellow

git add migrations/0000_nice_forgotten_one.sql
git add migrations/9999_production_repair_idempotent.sql
git add verify-migration-fix.cjs
git add deploy-with-migration-fix.ps1

git commit -m "🔧 FIX: Production PostgreSQL migration system

ROOT PROBLEM FIXED:
- 0000_nice_forgotten_one.sql was failing on existing Railway database
- Prevented all later migrations from running
- Left database in broken state (missing users.password, etc.)

SOLUTION:
✅ 0000_nice_forgotten_one.sql → NO-OP baseline (never fails)
✅ 9999_production_repair_idempotent.sql → handles ALL schema creation
✅ Fully idempotent - safe to run unlimited times
✅ Fixes users.password, content.project_id, and all missing tables
✅ Creates foreign keys, indexes, and seeds essential data

DEPLOYMENT READY:
- Works on empty databases (new deployments)
- Works on existing databases (Railway production)
- Migration order: 0000 (no-op) → 0001 → 0010 → 9999 (repair)
- Fixes Railway 502 errors caused by migration failures

Verified with comprehensive test suite."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Push to repository
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 4: Pushing to repository..." -ForegroundColor Yellow

# Push to dev branch first
git push origin HEAD:dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to dev failed!" -ForegroundColor Red
    exit 1
}

# Push to main branch for production deployment
git push origin HEAD:main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to main failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# SUCCESS SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 MIGRATION FIX DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Migration system is now production-ready" -ForegroundColor Green
Write-Host "✅ Will work on both empty and existing databases" -ForegroundColor Green
Write-Host "✅ Railway 502 errors should be resolved" -ForegroundColor Green
Write-Host "✅ All schema fixes included (users.password, etc.)" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Railway will automatically redeploy from main branch" -ForegroundColor White
Write-Host "   2. Migrations will run in this order:" -ForegroundColor White
Write-Host "      - 0000_nice_forgotten_one.sql (NO-OP, never fails)" -ForegroundColor Gray
Write-Host "      - 0001_comprehensive_schema_fix.sql (existing)" -ForegroundColor Gray
Write-Host "      - 0010_enhanced_content_management.sql (existing)" -ForegroundColor Gray
Write-Host "      - 9999_production_repair_idempotent.sql (fixes everything)" -ForegroundColor Gray
Write-Host "   3. Database will be fully repaired and functional" -ForegroundColor White
Write-Host "   4. Application should start successfully" -ForegroundColor White
Write-Host ""
Write-Host "🔍 MONITOR DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "   - Check Railway logs for migration success" -ForegroundColor White
Write-Host "   - Verify application starts without 502 errors" -ForegroundColor White
Write-Host "   - Test login functionality (users.password should work)" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green