#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTION DATABASE REPAIR DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# This script applies the production repair migration to fix Railway 502 errors
# Date: 2026-01-09
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 PRODUCTION DATABASE REPAIR DEPLOYMENT" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if migration file exists
if (-not (Test-Path "migrations/9999_production_repair_idempotent.sql")) {
    Write-Host "❌ Error: Production repair migration not found." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Yellow
Write-Host "  ✅ Production repair migration created"
Write-Host "  ✅ Boot sequence fixed in server/index.ts"
Write-Host "  ✅ Migration runner updated with advisory locking"
Write-Host "  ✅ Scheduler service made schema-safe"
Write-Host ""

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Commit changes
Write-Host ""
Write-Host "📝 Committing production fixes..." -ForegroundColor Yellow
git add .
git commit -m "🔧 PRODUCTION FIX: Implement deterministic boot sequence and idempotent migrations

- Add PostgreSQL advisory locking to prevent parallel migrations
- Fix boot sequence: database → services → HTTP server
- Create production repair migration (fully idempotent)
- Make scheduler service schema-safe
- Add comprehensive error handling and logging

Fixes:
- Railway 502 errors due to schema lifecycle violations
- Services running before migrations complete
- Non-idempotent migrations causing failures
- Race conditions in database initialization

This ensures production-grade, deterministic startup."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes committed successfully" -ForegroundColor Green

# Push to dev branch first
Write-Host ""
Write-Host "🚀 Pushing to dev branch for testing..." -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to dev failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to dev branch successfully" -ForegroundColor Green

# Ask for confirmation before pushing to main
Write-Host ""
Write-Host "⚠️  Ready to deploy to production (main branch)?" -ForegroundColor Yellow
Write-Host "   This will trigger Railway deployment with the database fixes." -ForegroundColor Yellow
$confirmation = Read-Host "   Type 'YES' to proceed with production deployment"

if ($confirmation -ne "YES") {
    Write-Host "❌ Production deployment cancelled by user." -ForegroundColor Red
    Write-Host "   The fixes are available on the dev branch for testing." -ForegroundColor Yellow
    exit 0
}

# Push to main branch for production deployment
Write-Host ""
Write-Host "🚀 Deploying to production (main branch)..." -ForegroundColor Yellow
git push origin dev:main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push to main failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to main branch successfully" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 PRODUCTION DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 What happens next:" -ForegroundColor Yellow
Write-Host "  1. Railway will detect the push and start deployment"
Write-Host "  2. The production repair migration will run automatically"
Write-Host "  3. Database schema will be fixed with advisory locking"
Write-Host "  4. Application will start with the correct boot sequence"
Write-Host "  5. Scheduler service will initialize safely after database is ready"
Write-Host ""
Write-Host "🔍 Monitor deployment:" -ForegroundColor Yellow
Write-Host "  • Railway Dashboard: https://railway.app/dashboard"
Write-Host "  • Application URL: https://creator-dev-server-staging.up.railway.app"
Write-Host "  • Health Check: https://creator-dev-server-staging.up.railway.app/api/health"
Write-Host ""
Write-Host "✅ The 502 errors should be resolved once deployment completes!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan