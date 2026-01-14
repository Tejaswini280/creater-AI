# Deploy 502 Error Fix to Railway
Write-Host "Deploying 502 error fix to Railway..." -ForegroundColor Green

# Commit the fixes
git add .
git commit -m "CRITICAL FIX: Resolve 502 error - Fix migration syntax error"

# Push to dev
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

# Push to main for Railway deployment  
Write-Host "Pushing to main for Railway deployment..." -ForegroundColor Yellow
git checkout main
git merge dev --no-edit
git push origin main
git checkout dev

Write-Host "502 error fix deployed successfully!" -ForegroundColor Green
Write-Host "Railway will now redeploy with the fixed migration file." -ForegroundColor Cyan