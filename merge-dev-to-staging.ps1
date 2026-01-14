# Merge Dev to Staging Branch

Write-Host "Merging dev branch to staging..." -ForegroundColor Cyan
Write-Host ""

# Make sure we're on dev
git checkout dev
git pull origin dev

Write-Host "Switching to staging branch..." -ForegroundColor Cyan
git checkout staging

Write-Host "Pulling latest staging..." -ForegroundColor Cyan
git pull origin staging

Write-Host "Merging dev into staging..." -ForegroundColor Cyan
git merge dev --no-ff -m "merge: dev to staging - seed data migration fix"

Write-Host "Pushing to staging..." -ForegroundColor Cyan
git push origin staging

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS - Dev merged to staging!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Railway will now detect the changes on staging branch" -ForegroundColor Yellow
Write-Host "and automatically redeploy with the fixed migration." -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitor deployment at: https://railway.app/dashboard" -ForegroundColor Cyan
