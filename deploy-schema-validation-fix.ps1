# Deploy Schema Validation Fix to Railway
# This fixes the infinite loop caused by per-migration schema validation

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING SCHEMA VALIDATION FIX TO RAILWAY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fix Summary:" -ForegroundColor Yellow
Write-Host "   - Removed per-migration schema validation" -ForegroundColor White
Write-Host "   - Only validate BEFORE and AFTER all migrations" -ForegroundColor White
Write-Host "   - Prevents infinite loop on migration 0000" -ForegroundColor White
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "server/services/strictMigrationRunner.ts")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Committing changes to git..." -ForegroundColor Cyan
git add server/services/strictMigrationRunner.ts
git add SCHEMA_VALIDATION_FIX_COMPLETE.md
git add deploy-schema-validation-fix.ps1
git commit -m "fix: Remove per-migration schema validation to prevent infinite loop

- Removed schema validation after each migration execution
- Only validate schema BEFORE all migrations (detect drift) and AFTER all migrations (verify success)
- Fixes infinite loop where migration 0000 was re-executed because projects.name didn't exist yet
- Migration 0000 creates extensions, migration 0001 creates projects table
- Schema validation now happens at the right time: after ALL migrations complete

This fixes the Railway 502 error loop caused by premature schema validation."

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Changes committed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Pushing to dev branch..." -ForegroundColor Cyan
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed" -ForegroundColor Red
    exit 1
}

Write-Host "Pushed to dev branch" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Triggering Railway deployment..." -ForegroundColor Cyan
Write-Host "   Railway will automatically deploy from the dev branch" -ForegroundColor White
Write-Host ""

Write-Host "================================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT INITIATED" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor Railway deployment logs" -ForegroundColor White
Write-Host "   2. Look for: MIGRATION PROCESS COMPLETED SUCCESSFULLY" -ForegroundColor White
Write-Host "   3. Verify application starts without 502 errors" -ForegroundColor White
Write-Host ""

Write-Host "Expected Railway Logs:" -ForegroundColor Cyan
Write-Host "   Starting strict migration execution..." -ForegroundColor Gray
Write-Host "   Skipping (already executed): 0000_nice_forgotten_one.sql" -ForegroundColor Gray
Write-Host "   Skipping (already executed): 0001_core_tables_idempotent.sql" -ForegroundColor Gray
Write-Host "   Performing final schema validation..." -ForegroundColor Gray
Write-Host "   Schema validation PASSED" -ForegroundColor Gray
Write-Host "   MIGRATION PROCESS COMPLETED SUCCESSFULLY" -ForegroundColor Gray
Write-Host ""

Write-Host "Deployment script completed!" -ForegroundColor Green
