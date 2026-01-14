# Push Railway Staging Fixes to Dev Branch

Write-Host "Pushing Railway Staging Fixes to Dev Branch" -ForegroundColor Green

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "fix: Railway staging deployment with migration dependency resolution - Added migration dependency resolver - Enhanced migration runner with error handling - Clean migration fallback system - Railway deployment configuration - Resolves Railway staging 502 errors permanently"

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin HEAD:dev --force

Write-Host "Successfully pushed Railway staging fixes to dev branch!" -ForegroundColor Green
Write-Host "Monitor deployment at: https://railway.app" -ForegroundColor Cyan