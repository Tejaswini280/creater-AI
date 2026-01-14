# Railway Password Hash Hotfix Deployment
# This script deploys the password_hash NULL constraint fix to Railway

Write-Host "Starting Railway Password Hash Hotfix Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Commit the hotfix migration
Write-Host "Step 1: Committing hotfix migration..." -ForegroundColor Yellow
git add migrations/0019_fix_password_hash_null_values_hotfix.sql
git commit -m "hotfix: Allow NULL password_hash for OAuth users - Fixes Railway 502 error"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Hotfix migration committed" -ForegroundColor Green
Write-Host ""

# Step 2: Push to dev branch
Write-Host "Step 2: Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push to dev failed" -ForegroundColor Red
    exit 1
}

Write-Host "Pushed to dev branch" -ForegroundColor Green
Write-Host ""

# Step 3: Merge to staging
Write-Host "Step 3: Merging to staging..." -ForegroundColor Yellow
git checkout staging
git pull origin staging
git merge dev -m "hotfix: Merge password_hash NULL constraint fix to staging"
git push origin staging

if ($LASTEXITCODE -ne 0) {
    Write-Host "Merge to staging failed" -ForegroundColor Red
    git checkout dev
    exit 1
}

Write-Host "Merged to staging" -ForegroundColor Green
Write-Host ""

# Step 4: Return to dev branch
git checkout dev

Write-Host ""
Write-Host "HOTFIX DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Railway will automatically detect the push to staging" -ForegroundColor White
Write-Host "2. The new migration will run automatically" -ForegroundColor White
Write-Host "3. Monitor deployment logs at: https://railway.app" -ForegroundColor White
Write-Host ""
Write-Host "What this fixes:" -ForegroundColor Yellow
Write-Host "  - Drops NOT NULL constraint from password_hash column" -ForegroundColor White
Write-Host "  - Allows OAuth users to have NULL password_hash" -ForegroundColor White
Write-Host "  - Fixes null value constraint violation error" -ForegroundColor White
Write-Host ""
