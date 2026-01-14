# Railway Password Hash Hotfix Deployment (Simple)
# This script deploys the password_hash NULL constraint fix to Railway

Write-Host "Starting Railway Password Hash Hotfix Deployment..." -ForegroundColor Cyan
Write-Host ""

# Ensure we're on dev branch
Write-Host "Ensuring we're on dev branch..." -ForegroundColor Yellow
git checkout dev

# Add and commit the hotfix migration
Write-Host "Committing hotfix migration..." -ForegroundColor Yellow
git add migrations/0019_fix_password_hash_null_values_hotfix.sql
git add deploy-railway-password-hash-hotfix-simple.ps1
git add verify-password-hash-hotfix.cjs
git add PASSWORD_HASH_NULL_CONSTRAINT_HOTFIX_COMPLETE.md
git commit -m "hotfix: Allow NULL password_hash for OAuth users - Fixes Railway 502 error"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: Files may already be committed" -ForegroundColor Yellow
}

# Push to dev branch (Railway will auto-deploy)
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "HOTFIX DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Railway will automatically detect the push" -ForegroundColor White
Write-Host "2. The new migration 0019 will run automatically" -ForegroundColor White
Write-Host "3. Monitor deployment logs at: https://railway.app" -ForegroundColor White
Write-Host ""
Write-Host "What this fixes:" -ForegroundColor Yellow
Write-Host "  - Drops NOT NULL constraint from password_hash column" -ForegroundColor White
Write-Host "  - Allows OAuth users to have NULL password_hash" -ForegroundColor White
Write-Host "  - Fixes: null value in column password_hash violates not-null constraint" -ForegroundColor White
Write-Host ""
Write-Host "After deployment completes, verify with:" -ForegroundColor Yellow
Write-Host "  node verify-password-hash-hotfix.cjs" -ForegroundColor Cyan
Write-Host ""
