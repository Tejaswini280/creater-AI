# Trigger Railway Redeploy with Fixed Migration

Write-Host "Triggering Railway Redeploy..." -ForegroundColor Cyan
Write-Host ""

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Make sure we're on dev
if ($currentBranch -ne "dev") {
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
}

# Pull latest changes
Write-Host ""
Write-Host "Pulling latest changes..." -ForegroundColor Cyan
git pull origin dev

# Create an empty commit to trigger Railway redeploy
Write-Host ""
Write-Host "Creating trigger commit..." -ForegroundColor Cyan
git commit --allow-empty -m "trigger: Railway redeploy with seed data migration fix"

# Push to trigger Railway
Write-Host ""
Write-Host "Pushing to trigger Railway deployment..." -ForegroundColor Cyan
git push origin dev

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Railway Redeploy Triggered!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "What happens next:" -ForegroundColor Cyan
Write-Host "1. Railway will detect the new commit" -ForegroundColor White
Write-Host "2. It will pull the latest code from dev branch" -ForegroundColor White
Write-Host "3. It will run migrations with the FIXED 0004_seed_essential_data.sql" -ForegroundColor White
Write-Host "4. The migration will succeed (no more popularity_score error)" -ForegroundColor White
Write-Host "5. Your application will start successfully" -ForegroundColor White
Write-Host ""
Write-Host "Check your Railway dashboard to monitor the deployment!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Expected result:" -ForegroundColor Cyan
Write-Host "  - Migration 0004_seed_essential_data.sql: SUCCESS" -ForegroundColor Green
Write-Host "  - Application status: RUNNING" -ForegroundColor Green
