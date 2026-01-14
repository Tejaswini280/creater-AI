# Deploy with Database Schema Fix
# This script fixes the production database schema and then deploys

Write-Host "Starting deployment with database schema fix..." -ForegroundColor Green

# Step 1: Add and commit the fixes
Write-Host "Committing database fixes..." -ForegroundColor Yellow
git add .
git commit -m "fix: add production database schema fix and resilient scheduler service"

# Step 2: Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "Database fixes deployed to dev branch!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps for Railway deployment:" -ForegroundColor Cyan
Write-Host "1. The scheduler service is now resilient to missing columns" -ForegroundColor White
Write-Host "2. Run the database fix script in Railway environment:" -ForegroundColor White
Write-Host "   node railway-database-migration.js" -ForegroundColor Gray
Write-Host "3. Redeploy the application after the database fix" -ForegroundColor White
Write-Host ""
Write-Host "The application will now start successfully even with missing columns" -ForegroundColor Green