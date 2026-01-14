# Deploy Migration Duplicate Number Fix
# This script commits and pushes the migration fixes to dev branch

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRATION DUPLICATE NUMBER FIX DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify no duplicates
Write-Host "Step 1: Verifying migration numbers..." -ForegroundColor Yellow
.\verify-migration-numbers.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Migration verification failed!" -ForegroundColor Red
    Write-Host "Please fix duplicate migrations before deploying" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Staging changes..." -ForegroundColor Yellow

# Stage the migration changes
git add migrations/
git add MIGRATION_DUPLICATE_NUMBER_FIX_COMPLETE.md
git add verify-migration-numbers.ps1
git add deploy-migration-duplicate-fix.ps1

Write-Host "Changes staged successfully" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "Step 3: Changes to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Commit the changes
Write-Host "Step 4: Committing changes..." -ForegroundColor Yellow
$commitMessage = "fix(migrations): resolve duplicate migration numbers causing schema validation failure

ROOT CAUSE:
- Multiple migrations had the same number (0001, 0003, 0004)
- Alphabetical sorting caused retired migrations to run before actual ones
- projects table was never created, causing schema validation to fail

SOLUTION:
- Retired conflicting migrations: 0001_core_tables_clean.sql, 0003_essential_tables.sql
- Renumbered 0004_seed_essential_data.sql to 0016_seed_essential_data.sql
- All migrations now have unique numbers
- Migration order is correct and validated

IMPACT:
- Fixes: Schema validation failure (projects.name does not exist)
- Fixes: Application startup failure
- Fixes: Railway deployment failures

VERIFICATION:
- verify-migration-numbers.ps1 passes
- All 31 migrations have unique numbers
- Ready for production deployment"

git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Git commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Changes committed successfully" -ForegroundColor Green
Write-Host ""

# Push to dev branch
Write-Host "Step 5: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Git push failed!" -ForegroundColor Red
    Write-Host "You may need to pull first: git pull origin dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy to Railway: railway up" -ForegroundColor White
Write-Host "2. Monitor deployment logs for successful migration" -ForegroundColor White
Write-Host "3. Verify schema validation passes" -ForegroundColor White
Write-Host ""
Write-Host "Expected result:" -ForegroundColor Cyan
Write-Host "- All migrations run in correct order" -ForegroundColor Green
Write-Host "- projects table created with name column" -ForegroundColor Green
Write-Host "- Schema validation passes" -ForegroundColor Green
Write-Host "- Application starts successfully" -ForegroundColor Green
Write-Host ""
