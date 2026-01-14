# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY MIGRATION SYSTEM FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the permanent migration system fix to production
# 
# WHAT IT DOES:
# 1. Validates the migration system locally
# 2. Commits migration 0031 and updated migration runner
# 3. Pushes to dev branch for testing
# 4. Provides instructions for production deployment
#
# SAFETY:
# - Tests migrations on fresh database before deployment
# - Tests idempotency on existing database
# - Validates schema after migrations
# - Requires manual approval before production push
#
# Date: 2026-01-14
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "MIGRATION SYSTEM FIX DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate migration system
Write-Host "STEP 1: VALIDATING MIGRATION SYSTEM" -ForegroundColor Yellow
Write-Host "Running validation tests..." -ForegroundColor Blue
Write-Host ""

node scripts/validate-migration-system.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ VALIDATION FAILED - ABORTING DEPLOYMENT" -ForegroundColor Red
    Write-Host "Fix the issues above before deploying" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ VALIDATION PASSED - MIGRATION SYSTEM IS READY" -ForegroundColor Green
Write-Host ""

# Step 2: Show what will be committed
Write-Host "STEP 2: REVIEWING CHANGES" -ForegroundColor Yellow
Write-Host ""

$filesToCommit = @(
    "migrations/0031_true_baseline_consolidation.sql",
    "server/services/strictMigrationRunner.ts",
    "MIGRATION_SYSTEM_ROOT_CAUSE_ANALYSIS_AND_PERMANENT_SOLUTION.md",
    "MIGRATION_SYSTEM_IMPLEMENTATION_GUIDE.md",
    "scripts/validate-migration-system.cjs"
)

Write-Host "Files to be committed:" -ForegroundColor Blue
foreach ($file in $filesToCommit) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Git status:" -ForegroundColor Blue
git status --short $filesToCommit

Write-Host ""
$confirm = Read-Host "Do you want to commit these changes? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ DEPLOYMENT CANCELLED" -ForegroundColor Red
    exit 1
}

# Step 3: Commit changes
Write-Host ""
Write-Host "STEP 3: COMMITTING CHANGES" -ForegroundColor Yellow
Write-Host ""

git add $filesToCommit

$commitMessage = @"
feat: Permanent migration system fix (0031 baseline consolidation)

ROOT CAUSE FIXES:
- Migration 0000 was not a true baseline (only created schema_migrations table)
- Actual schema was fragmented across 31 migrations (21 never executed)
- Migrations skipped based on false positives (table exists checks)
- Exhaustive column validation caused false positives on schema evolution

SOLUTION:
- Created migration 0031: True baseline consolidation (all schema in one file)
- Updated strictMigrationRunner: Minimum required validation (not exhaustive)
- Added schema validation before skipping migrations
- Added checksum validation to prevent editing applied migrations

GUARANTEES:
- No schema drift (migrations are immutable and checksummed)
- No skipped migrations (schema validation prevents false positives)
- No false positives (minimum required validation allows evolution)
- No startup failures (fail-fast on schema mismatch)

TESTING:
- ✅ Fresh database test passed (creates complete schema)
- ✅ Idempotency test passed (safe on existing database)
- ✅ Migration runner test passed (validates schema)

See: MIGRATION_SYSTEM_ROOT_CAUSE_ANALYSIS_AND_PERMANENT_SOLUTION.md
See: MIGRATION_SYSTEM_IMPLEMENTATION_GUIDE.md
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ COMMIT FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "✅ CHANGES COMMITTED" -ForegroundColor Green

# Step 4: Push to dev branch
Write-Host ""
Write-Host "STEP 4: PUSHING TO DEV BRANCH" -ForegroundColor Yellow
Write-Host ""

$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Blue

if ($currentBranch -ne "dev") {
    Write-Host "⚠️  WARNING: You are not on the 'dev' branch" -ForegroundColor Yellow
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
    Write-Host ""
    $switchBranch = Read-Host "Do you want to switch to 'dev' branch? (yes/no)"
    
    if ($switchBranch -eq "yes") {
        git checkout dev
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ FAILED TO SWITCH TO DEV BRANCH" -ForegroundColor Red
            exit 1
        }
        
        # Cherry-pick the commit
        $commitHash = git rev-parse HEAD~1
        git cherry-pick $commitHash
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ FAILED TO CHERRY-PICK COMMIT" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "Pushing to origin/dev..." -ForegroundColor Blue
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PUSH FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PUSHED TO DEV BRANCH" -ForegroundColor Green

# Step 5: Instructions for production deployment
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUCCESSFUL - NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Changes committed and pushed to dev branch" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. VERIFY ON STAGING:" -ForegroundColor Blue
Write-Host "   - Wait for Railway to deploy dev branch" -ForegroundColor White
Write-Host "   - Check Railway logs for migration success" -ForegroundColor White
Write-Host "   - Verify application starts successfully" -ForegroundColor White
Write-Host "   - Test critical features" -ForegroundColor White
Write-Host ""

Write-Host "2. MERGE TO MAIN (PRODUCTION):" -ForegroundColor Blue
Write-Host "   git checkout main" -ForegroundColor White
Write-Host "   git merge dev" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "3. MONITOR PRODUCTION:" -ForegroundColor Blue
Write-Host "   - Check Railway logs for migration success" -ForegroundColor White
Write-Host "   - Verify health endpoint: https://your-app.railway.app/health" -ForegroundColor White
Write-Host "   - Monitor error rates for 30 minutes" -ForegroundColor White
Write-Host ""

Write-Host "DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "  • Root Cause Analysis: MIGRATION_SYSTEM_ROOT_CAUSE_ANALYSIS_AND_PERMANENT_SOLUTION.md" -ForegroundColor White
Write-Host "  • Implementation Guide: MIGRATION_SYSTEM_IMPLEMENTATION_GUIDE.md" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT SCRIPT COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
