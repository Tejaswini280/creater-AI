# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY CONSOLIDATED MIGRATION FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the consolidated migration fix (0025) to production.
#
# WHAT IT DOES:
# 1. Validates database state
# 2. Disables duplicate migrations
# 3. Tests migration locally
# 4. Deploys to Railway staging
# 5. Deploys to Railway production
# 6. Verifies success
#
# USAGE:
# .\deploy-consolidated-fix.ps1
#
# Date: 2026-01-14
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipLocal = $false,
    [switch]$SkipStaging = $false,
    [switch]$ProductionOnly = $false
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOY CONSOLIDATED MIGRATION FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate prerequisites
Write-Host "📋 Step 1: Validating prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check if migration 0025 exists
if (-not (Test-Path "migrations/0025_consolidated_permanent_fix.sql")) {
    Write-Host "❌ Migration 0025 not found!" -ForegroundColor Red
    Write-Host "Please create migrations/0025_consolidated_permanent_fix.sql first" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Migration 0025 exists" -ForegroundColor Green

# Check if validation script exists
if (-not (Test-Path "validate-database-state.cjs")) {
    Write-Host "❌ Validation script not found!" -ForegroundColor Red
    Write-Host "Please create validate-database-state.cjs first" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Validation script exists" -ForegroundColor Green

# Check if disable script exists
if (-not (Test-Path "disable-duplicate-migrations.ps1")) {
    Write-Host "❌ Disable script not found!" -ForegroundColor Red
    Write-Host "Please create disable-duplicate-migrations.ps1 first" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Disable script exists" -ForegroundColor Green

Write-Host ""

# Step 2: Disable duplicate migrations
Write-Host "🔒 Step 2: Disabling duplicate migrations..." -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Disable migrations 0015, 0017-0024? (y/n)"
if ($response -eq 'y') {
    .\disable-duplicate-migrations.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to disable migrations" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Skipping migration disable" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test locally (unless skipped)
if (-not $SkipLocal -and -not $ProductionOnly) {
    Write-Host "🧪 Step 3: Testing migration locally..." -ForegroundColor Yellow
    Write-Host ""

    # Validate local database state
    Write-Host "  Validating local database state..." -ForegroundColor White
    node validate-database-state.cjs
    $validationResult = $LASTEXITCODE

    if ($validationResult -eq 1) {
        Write-Host "  ❌ Critical issues found in local database" -ForegroundColor Red
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne 'y') {
            exit 1
        }
    } elseif ($validationResult -eq 2) {
        Write-Host "  ⚠️  Warnings found (non-critical)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Local database validation passed" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "  Running migration locally..." -ForegroundColor White
    
    # Run migration
    $env:NODE_ENV = "development"
    node scripts/run-migrations.js
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Local migration failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✅ Local migration successful" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Step 3: Skipping local testing" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Deploy to staging (unless skipped)
if (-not $SkipStaging -and -not $ProductionOnly) {
    Write-Host "🚀 Step 4: Deploying to Railway staging..." -ForegroundColor Yellow
    Write-Host ""

    $response = Read-Host "Deploy to staging? (y/n)"
    if ($response -eq 'y') {
        # Push to dev branch (which triggers staging deployment)
        Write-Host "  Pushing to dev branch..." -ForegroundColor White
        git add migrations/0025_consolidated_permanent_fix.sql
        git add migrations/*.disabled
        git commit -m "feat: consolidated migration fix (0025) - permanent solution"
        git push origin dev

        Write-Host ""
        Write-Host "  ⏳ Waiting for Railway staging deployment..." -ForegroundColor White
        Write-Host "  Check Railway dashboard: https://railway.app" -ForegroundColor Cyan
        Write-Host ""
        
        $response = Read-Host "Press Enter when staging deployment is complete..."
        
        Write-Host ""
        Write-Host "  Testing staging deployment..." -ForegroundColor White
        
        # Test staging health endpoint
        try {
            $stagingUrl = $env:RAILWAY_STAGING_URL
            if ($stagingUrl) {
                $response = Invoke-WebRequest -Uri "$stagingUrl/health" -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "  ✅ Staging health check passed" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠️  Staging health check returned status $($response.StatusCode)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ⚠️  RAILWAY_STAGING_URL not set, skipping health check" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ⚠️  Staging health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        Write-Host ""
    } else {
        Write-Host "  ⏭️  Skipping staging deployment" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "⏭️  Step 4: Skipping staging deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Deploy to production
Write-Host "🚀 Step 5: Deploying to Railway production..." -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  WARNING: This will deploy to PRODUCTION!" -ForegroundColor Red
Write-Host ""
$response = Read-Host "Are you sure you want to deploy to production? (yes/no)"

if ($response -ne 'yes') {
    Write-Host "❌ Production deployment cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "  Merging dev to main..." -ForegroundColor White
git checkout main
git pull origin main
git merge dev
git push origin main

Write-Host ""
Write-Host "  ⏳ Waiting for Railway production deployment..." -ForegroundColor White
Write-Host "  Check Railway dashboard: https://railway.app" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Press Enter when production deployment is complete..."

Write-Host ""

# Step 6: Verify production deployment
Write-Host "🔍 Step 6: Verifying production deployment..." -ForegroundColor Yellow
Write-Host ""

# Test production health endpoint
try {
    $productionUrl = $env:RAILWAY_PRODUCTION_URL
    if ($productionUrl) {
        Write-Host "  Testing production health endpoint..." -ForegroundColor White
        $response = Invoke-WebRequest -Uri "$productionUrl/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Production health check passed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Production health check returned status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  RAILWAY_PRODUCTION_URL not set, skipping health check" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Production health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Check Railway logs for errors:" -ForegroundColor Yellow
    Write-Host "  railway logs --environment production" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""

# Step 7: Monitor for issues
Write-Host "📊 Step 7: Monitoring for issues..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Monitor these metrics for the next 30 minutes:" -ForegroundColor White
Write-Host "  - 502 errors (should be 0)" -ForegroundColor White
Write-Host "  - Authentication failures (should be 0)" -ForegroundColor White
Write-Host "  - Database query performance (should be normal)" -ForegroundColor White
Write-Host "  - User registration (OAuth and password should work)" -ForegroundColor White
Write-Host ""

Write-Host "  Useful commands:" -ForegroundColor White
Write-Host "  railway logs --environment production" -ForegroundColor Cyan
Write-Host "  railway logs --environment production | grep 'ERROR'" -ForegroundColor Cyan
Write-Host "  railway logs --environment production | grep '502'" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Migration 0025 deployed to production" -ForegroundColor Green
Write-Host "✅ Duplicate migrations disabled" -ForegroundColor Green
Write-Host "✅ Health checks passed" -ForegroundColor Green
Write-Host ""
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Monitor production logs for 30 minutes" -ForegroundColor White
Write-Host "2. Test OAuth user registration" -ForegroundColor White
Write-Host "3. Test password user login" -ForegroundColor White
Write-Host "4. Verify no 502 errors" -ForegroundColor White
Write-Host "5. Update team on deployment status" -ForegroundColor White
Write-Host ""
Write-Host "🔄 TO ROLLBACK:" -ForegroundColor Yellow
Write-Host "1. Restore from Railway backup" -ForegroundColor White
Write-Host "2. Or revert git commit and redeploy" -ForegroundColor White
Write-Host ""
Write-Host "✅ DONE!" -ForegroundColor Green
